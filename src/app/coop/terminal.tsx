import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, ScrollView, Text, View } from "react-native";

import { PinPicker } from "@/components/coop/pin-picker";
import { FormField } from "@/components/form-field";
import { createTerminal, updateTerminal } from "@/lib/api/coop";
import { terminalSchema } from "@/lib/validation";

const nameSchema = terminalSchema.pick({ name: true });

// Add (no params) or edit (id, name, lat, lng from the list row).
export default function TerminalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string; lat?: string; lng?: string }>();
  const editing = params.id !== undefined;
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    editing ? { lat: Number(params.lat), lng: Number(params.lng) } : null,
  );
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [noPin, setNoPin] = useState(false);
  const { control, handleSubmit } = useForm<{ name: string }>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: params.name ?? "" },
  });

  const onSave = handleSubmit(async ({ name }) => {
    setSaveError(null);
    if (!pin) {
      setNoPin(true);
      return;
    }
    // Full schema check, including the lat/lng ranges, before anything is sent.
    const parsed = terminalSchema.safeParse({ name, ...pin });
    if (!parsed.success) {
      setSaveError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (editing) await updateTerminal(params.id!, parsed.data);
      else await createTerminal(parsed.data);
      router.back();
    } catch (e) {
      setSaveError((e as Error).message);
      setBusy(false);
    }
  });

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-6"
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: editing ? "Edit terminal" : "Add terminal" }} />
      <FormField control={control} name="name" label="Terminal name" placeholder="Naga Centro" />

      <View className="gap-2">
        <Text className="font-medium text-foreground">Location: tap the map to place the pin</Text>
        <PinPicker
          pin={pin}
          onPick={(p) => {
            setPin(p);
            setNoPin(false);
          }}
        />
        <Text className="text-muted">
          {pin ? `Lat ${pin.lat.toFixed(6)}, Lng ${pin.lng.toFixed(6)}` : "No pin yet"}
        </Text>
        {noPin && <Text className="text-destructive">Tap the map to place the pin</Text>}
      </View>

      {saveError && <Text className="text-destructive">{saveError}</Text>}

      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={onSave}
        className="items-center rounded-lg bg-primary py-3"
      >
        <Text className="font-semibold text-white">{busy ? "Saving..." : "Save terminal"}</Text>
      </Pressable>
    </ScrollView>
  );
}
