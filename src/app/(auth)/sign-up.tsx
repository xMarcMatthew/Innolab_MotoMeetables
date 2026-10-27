import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";

import { roleFromParam, RoleSwitch } from "@/components/auth/role-switch";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { colors } from "@/lib/colors";
import { setWantsDriver } from "@/lib/onboarding";
import { supabase } from "@/lib/supabase";
import { PASSWORD_RULES, type SignUp, signUpSchema } from "@/lib/validation";

// The rules are visible before any error, on one wrapped line, and each one ticks as the password meets it.
function PasswordRules({ password }: { password: string }) {
  return (
    <View className="flex-row flex-wrap gap-x-4 gap-y-1">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <View
            key={rule.label}
            className="flex-row items-center gap-1"
            accessibilityLabel={`${rule.label}: ${met ? "done" : "not yet"}`}
          >
            <MaterialCommunityIcons
              name={met ? "check-circle" : "circle-outline"}
              size={16}
              color={met ? colors.primary : colors.muted}
            />
            <Text className={`text-sm ${met ? "text-foreground" : "text-muted"}`}>
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function SignUpScreen() {
  const { as } = useLocalSearchParams<{ as?: string }>();
  const role = roleFromParam(as);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const { control, handleSubmit, formState } = useForm<SignUp>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });
  const password = useWatch({ control, name: "password" });

  // Every sign-up is a commuter: the handle_new_user trigger copies full_name into profiles. The role on
  // screen at submit decides whether the new account lands on Waiting (drivers, Decisions D2).
  const onSubmit = handleSubmit(async ({ fullName, email, password }) => {
    setMessage(null);
    await setWantsDriver(role === "driver");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) setMessage({ text: error.message, isError: true });
    // No session means "Confirm email" is still on in the Supabase dashboard.
    else if (!data.session)
      setMessage({
        text: "Check your email to confirm your account, then sign in.",
        isError: false,
      });
  });

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-6"
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: role === "driver" ? "Driver account" : "Create account" }} />
      <Wordmark width={150} />
      <RoleSwitch value={role} onChange={(r) => router.setParams({ as: r })} />
      <FormField control={control} name="fullName" label="Full name" autoComplete="name" />
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
        autoComplete="new-password"
        secureTextEntry
      />
      <PasswordRules password={password} />
      <FormField
        control={control}
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        secureTextEntry
      />
      {message && (
        <Text
          accessibilityLiveRegion="polite"
          className={message.isError ? "text-destructive" : "text-foreground"}
        >
          {message.text}
        </Text>
      )}
      <Button
        label="Create account"
        loading={formState.isSubmitting}
        loadingLabel="Creating account..."
        onPress={onSubmit}
      />
      <Button
        label="Already have an account? Sign in"
        variant="link"
        onPress={() => router.replace({ pathname: "/sign-in", params: { as: role } })}
      />
      {role === "driver" && (
        <View className="flex-row items-start gap-2 rounded-lg border border-border bg-white p-4">
          <MaterialCommunityIcons name="information-outline" size={20} color={colors.muted} />
          <Text className="flex-1 text-muted">
            <Text className="font-semibold text-foreground">Still in development.</Text> Driver
            onboarding is not finished: after you create an account, your coop adds you to a vehicle
            before you can start a trip.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
