import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, ScrollView, Text } from "react-native";

import { FormField } from "@/components/form-field";
import { supabase } from "@/lib/supabase";
import { type SignUp, signUpSchema } from "@/lib/validation";

export default function SignUpScreen() {
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const { control, handleSubmit, formState } = useForm<SignUp>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  // Every sign-up is a commuter: the handle_new_user trigger copies full_name into profiles.
  const onSubmit = handleSubmit(async ({ fullName, email, password }) => {
    setMessage(null);
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
      {message && (
        <Text className={message.isError ? "text-destructive" : "text-foreground"}>
          {message.text}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={formState.isSubmitting}
        onPress={onSubmit}
        className="items-center rounded-lg bg-primary py-3"
      >
        <Text className="font-semibold text-white">
          {formState.isSubmitting ? "Creating account..." : "Create account"}
        </Text>
      </Pressable>
      <Link href="/sign-in" replace className="text-center font-semibold text-primary">
        Already have an account? Sign in
      </Link>
    </ScrollView>
  );
}
