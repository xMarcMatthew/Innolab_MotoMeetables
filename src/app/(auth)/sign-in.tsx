import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ScrollView, Text } from "react-native";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
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
      <Text className="text-4xl font-bold text-foreground">Larga</Text>
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
      <Button
        label="Sign in"
        loading={formState.isSubmitting}
        loadingLabel="Signing in..."
        onPress={onSubmit}
      />
      <Button
        label="No account yet? Create one"
        variant="link"
        onPress={() => router.replace("/sign-up")}
      />
    </ScrollView>
  );
}
