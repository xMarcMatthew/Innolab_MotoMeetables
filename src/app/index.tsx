import { Link } from "expo-router";
import { Text, View } from "react-native";

// shortcut: manual role picker so each owner can reach their screens, replace with a redirect by profiles.role once auth lands
export default function Index() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background">
      <Text className="text-foreground">TEMP ROLE PICKER (remove when login works)</Text>
      <Link href="/commuter" className="font-semibold text-primary">
        Commuter
      </Link>
      <Link href="/driver" className="font-semibold text-primary">
        Driver
      </Link>
      <Link href="/coop" className="font-semibold text-primary">
        Coop
      </Link>
    </View>
  );
}
