import { zodResolver } from "@hookform/resolvers/zod";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ScrollView, Text } from "react-native";

import { roleFromParam, RoleSwitch } from "@/components/auth/role-switch";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { setWantsDriver } from "@/lib/onboarding";
import { supabase } from "@/lib/supabase";
import { type SignIn, signInSchema } from "@/lib/validation";

export default function SignInScreen() {
  const { as } = useLocalSearchParams<{ as?: string }>();
  const role = roleFromParam(as);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<SignIn>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  // The role on screen at submit decides where a still-commuter account lands (Waiting for drivers, Decisions D2).
  // On success the root layout sees the new session and routes to the role's home.
  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null);
    await setWantsDriver(role === "driver");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  });

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-6"
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: role === "driver" ? "Driver sign in" : "Sign in" }} />
      <Wordmark width={150} />
      <RoleSwitch value={role} onChange={(r) => router.setParams({ as: r })} />
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
      {error && (
        <Text accessibilityLiveRegion="polite" className="text-destructive">
          {error}
        </Text>
      )}
      <Button
        label="Sign in"
        loading={formState.isSubmitting}
        loadingLabel="Signing in..."
        onPress={onSubmit}
      />
      <Button
        label="No account yet? Create one"
        variant="link"
        onPress={() => router.replace({ pathname: "/sign-up", params: { as: role } })}
      />
    </ScrollView>
  );
}
