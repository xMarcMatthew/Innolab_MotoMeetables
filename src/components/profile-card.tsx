import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Text, View } from "react-native";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { colors } from "@/lib/colors";
import { shortName } from "@/lib/names";
import { supabase } from "@/lib/supabase";
import { type FullName, fullNameSchema } from "@/lib/validation";

// "Marc Matthew Bagasbas" -> "MB". Photos are not stored anywhere, so the initials stand in for one.
function initials(fullName: string | null): string {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

// A 64 dp circle with the initials, or a generic person when there is no name. Decorative: the name is beside it.
function Avatar({ fullName }: { fullName: string | null }) {
  const text = initials(fullName);
  return (
    <View
      className="size-16 items-center justify-center rounded-full bg-primary"
      importantForAccessibility="no-hide-descendants"
    >
      {text ? (
        <Text className="text-2xl font-bold text-white">{text}</Text>
      ) : (
        <MaterialCommunityIcons name="account" size={36} color={colors.white} />
      )}
    </View>
  );
}

type Props = {
  fullName: string | null;
  email: string;
  seenBy: string; // "Others" or "Riders"
  lines?: string[]; // extra facts, e.g. the driver's coop
  onSaved: () => void;
};

// Name, email and how others see it, with an inline rename. RLS lets a user change only their own full_name.
export function ProfileCard({ fullName, email, seenBy, lines = [], onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState, reset } = useForm<FullName>({
    resolver: zodResolver(fullNameSchema),
    values: { fullName: fullName ?? "" },
  });

  const save = handleSubmit(async ({ fullName: next }) => {
    setError(null);
    const { data: auth } = await supabase.auth.getSession();
    if (!auth.session) return; // the root layout's guard sends logged-out users to sign-in
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: next })
      .eq("id", auth.session.user.id);
    if (error) return setError(error.message);
    setEditing(false);
    onSaved();
  });

  const cancel = () => {
    reset();
    setError(null);
    setEditing(false);
  };

  if (editing) {
    return (
      <Card>
        <FormField
          control={control}
          name="fullName"
          label="Full name"
          autoComplete="name"
          autoFocus
        />
        {error && (
          <Text accessibilityLiveRegion="polite" className="text-destructive">
            {error}
          </Text>
        )}
        <View className="flex-row gap-2">
          <Button
            label="Save"
            loading={formState.isSubmitting}
            loadingLabel="Saving..."
            onPress={save}
            className="flex-1"
          />
          <Button label="Cancel" variant="outline" onPress={cancel} className="flex-1" />
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <View className="flex-row items-center gap-4">
        <Avatar fullName={fullName} />
        <View className="flex-1 gap-1">
          <Text className="text-2xl font-bold text-foreground">{fullName ?? "No name set"}</Text>
          <Text className="text-muted">{email}</Text>
        </View>
      </View>
      {lines.map((line) => (
        <Text key={line} className="font-medium text-foreground">
          {line}
        </Text>
      ))}
      <Text className="text-sm text-muted">
        {seenBy} see you as {shortName(fullName)}
      </Text>
      <Button
        label="Edit name"
        variant="link"
        onPress={() => setEditing(true)}
        className="self-start"
      />
    </Card>
  );
}
