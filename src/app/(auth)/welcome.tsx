import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function WelcomeScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
      <Text className="text-foreground">PLACEHOLDER: welcome (Worker B)</Text>
      <Link href="/sign-in" className="font-semibold text-primary">
        Sign in
      </Link>
    </View>
  );
}
