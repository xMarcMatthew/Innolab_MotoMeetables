import { Pressable, Text } from "react-native";

import { supabase } from "@/lib/supabase";

// The root layout's guard sees the session end and moves to sign-in.
export function SignOutButton() {
  return (
    <Pressable accessibilityRole="button" onPress={() => supabase.auth.signOut()}>
      <Text className="font-semibold text-primary">Sign out</Text>
    </Pressable>
  );
}
