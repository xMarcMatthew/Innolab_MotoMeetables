import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors } from "@/lib/colors";

// shortcut: empty state only, boardings come with board_vehicle after H10. Then list
// supabase.from("boardings").select("id, boarded_at, vehicle:vehicles(plate, vehicle_type)").order("boarded_at", { ascending: false })
export default function TripsScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
      <MaterialCommunityIcons name="bus-clock" size={48} color={colors.muted} />
      <Text className="text-center text-muted">
        Your rides will show here after your first boarding scan.
      </Text>
    </View>
  );
}
