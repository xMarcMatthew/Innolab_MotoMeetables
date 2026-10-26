import { Link } from "expo-router";
import { Text, View, StyleSheet } from "react-native";

// shortcut: manual role picker so each owner can reach their screens, replace with a redirect by profiles.role once auth lands
export default function Index() {
  return (
    <View style={styles.container}>
      <Text>TEMP ROLE PICKER (remove when login works)</Text>
      <Link href="/commuter">Commuter</Link>
      <Link href="/driver">Driver</Link>
      <Link href="/coop">Coop</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
});
