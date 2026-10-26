import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, ScrollView, Text } from "react-native";

import { FormField } from "@/components/form-field";
import { supabase } from "@/lib/supabase";
import { type SignIn, signInSchema } from "@/lib/validation";

export default function SignInScreen() {
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<SignIn>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  // On success the root layout sees the new session and routes to the role's home.
  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  });

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-6"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-3xl font-bold text-foreground">Larga</Text>
      <FormField
        control={control}
        name="email"
        label="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <FormField
        control={control}
        name="password"
        label="Password"
        autoComplete="password"
        secureTextEntry
      />
      {error && <Text className="text-destructive">{error}</Text>}
      <Pressable
        accessibilityRole="button"
        disabled={formState.isSubmitting}
        onPress={onSubmit}
        className="items-center rounded-lg bg-primary py-3"
      >
        <Text className="font-semibold text-white">
          {formState.isSubmitting ? "Signing in..." : "Sign in"}
        </Text>
      </Pressable>
      <Link href="/sign-up" replace className="text-center font-semibold text-primary">
        No account yet? Create one
      </Link>
    </ScrollView>
  );
}
