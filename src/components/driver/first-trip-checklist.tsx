import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { AppState, Linking, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { colors } from "@/lib/colors";

type Permission = { granted: boolean; status: string; canAskAgain: boolean };

function Step({
  title,
  body,
  done,
  permission,
  onAllow,
}: {
  title: string;
  body: string | null;
  done: boolean;
  permission?: Permission;
  onAllow?: () => void;
}) {
  // A first Deny can still be asked again; only a permanent refusal needs the Settings app.
  const blocked = permission?.status === "denied" && !permission.canAskAgain;
  return (
    <Card>
      <Text className="font-semibold text-foreground">{title}</Text>
      {body && <Text className="text-muted">{body}</Text>}
      {done ? (
        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
          <Text className="font-semibold text-foreground">Done</Text>
        </View>
      ) : (
        onAllow && (
          <Button
            label={blocked ? "Open settings" : "Allow"}
            onPress={blocked ? () => Linking.openSettings() : onAllow}
          />
        )
      )}
    </Card>
  );
}

export function FirstTripChecklist({ vehicleAssigned }: { vehicleAssigned: boolean }) {
  const [location, setLocation] = useState<Permission | null>(null);
  const [notifications, setNotifications] = useState<Permission | null>(null);

  useEffect(() => {
    const refresh = () => {
      Location.getBackgroundPermissionsAsync().then(setLocation);
      Notifications.getPermissionsAsync().then(setNotifications);
    };
    refresh();
    // Re-read after the driver comes back from the Settings app.
    const sub = AppState.addEventListener("change", (s) => s === "active" && refresh());
    return () => sub.remove();
  }, []);

  async function allowLocation() {
    const foreground = await Location.requestForegroundPermissionsAsync();
    // Without foreground there is no background; keep the foreground answer so a refusal shows Open settings.
    setLocation(
      foreground.granted ? await Location.requestBackgroundPermissionsAsync() : foreground,
    );
  }

  if (!location || !notifications) return null;
  if (vehicleAssigned && location.granted && notifications.granted) return null;

  return (
    <View className="gap-3">
      <Step
        title="Vehicle assigned"
        body={vehicleAssigned ? null : "Ask your coop to assign your plate to this account."}
        done={vehicleAssigned}
      />
      <Step
        title="Location: Allow all the time"
        body="Larga shares where your jeep is while you are on a trip."
        done={location.granted}
        permission={location}
        onAllow={allowLocation}
      />
      <Step
        title="Notifications"
        body="Riders get told when you start loading."
        done={notifications.granted}
        permission={notifications}
        onAllow={async () => setNotifications(await Notifications.requestPermissionsAsync())}
      />
      <Text className="text-muted">Keep Larga open on the dashboard while on a trip.</Text>
    </View>
  );
}
