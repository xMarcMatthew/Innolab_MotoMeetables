import Constants from "expo-constants";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Linking, ScrollView, View } from "react-native";

import { VEHICLE_TYPE_ICONS, VEHICLE_TYPE_LABELS } from "@/components/coop/vehicle-type-chips";
import { ProfileCard } from "@/components/profile-card";
import { signOut } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { SectionLabel } from "@/components/ui/section-label";
import { SettingsRow } from "@/components/ui/settings-row";
import { useMyVehicle } from "@/hooks/use-my-vehicle";
import { supabase } from "@/lib/supabase";
import { isOnTrip } from "@/lib/trip";

const VERSION = Constants.expoConfig?.version ?? "dev";

type Account = { fullName: string | null; email: string; coopName: string | null };
type Permission = { granted: boolean; canAskAgain: boolean };

// Signing out ends a running trip, so it asks first while one is running.
async function onSignOut() {
  // The task check can reject on a phone where the task never registered; then just sign out.
  const onTrip = await isOnTrip().catch(() => false);
  if (!onTrip) return signOut();
  Alert.alert(
    "End your trip and sign out?",
    "Location sharing stops and your vehicle goes off duty.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "End trip and sign out", style: "destructive", onPress: () => signOut() },
    ],
  );
}

const permissionValue = (p: Permission | null, allowed: string, missing: string) =>
  p === null ? "Checking..." : p.granted ? allowed : missing;
const permissionTone = (p: Permission | null) =>
  p === null ? undefined : p.granted ? "success" : "destructive";

// Profile with rename, the vehicle the coop gave this driver, the two permissions a trip needs, Sign out.
export default function DriverAccount() {
  const { vehicle } = useMyVehicle();
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Permission | null>(null);
  const [notifications, setNotifications] = useState<Permission | null>(null);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getSession();
    if (!auth.session) return; // the root layout's guard sends logged-out users to sign-in
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, coop:coops(name)")
      .eq("id", auth.session.user.id)
      .single();
    if (error) return setError(error.message);
    const coop = data.coop as unknown as { name: string } | null;
    setError(null);
    setAccount({
      fullName: data.full_name,
      email: auth.session.user.email ?? "",
      coopName: coop?.name ?? null,
    });
  }, []);

  // Re-read on focus: permissions change in the Settings app.
  useFocusEffect(
    useCallback(() => {
      load();
      Location.getBackgroundPermissionsAsync().then(setLocation);
      Notifications.getPermissionsAsync().then(setNotifications);
    }, [load]),
  );

  // A first Deny can be asked again; a permanent refusal needs the Settings app.
  const fix =
    (p: Permission | null, ask: () => Promise<Permission>, set: (p: Permission) => void) =>
    async () => {
      if (p && !p.granted && p.canAskAgain) set(await ask());
      else Linking.openSettings();
    };

  async function askLocation(): Promise<Permission> {
    const foreground = await Location.requestForegroundPermissionsAsync();
    // Without foreground there is no background; keep the foreground answer so a refusal shows Open settings.
    return foreground.granted ? Location.requestBackgroundPermissionsAsync() : foreground;
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-6">
      {error ? (
        <ErrorState message={`Could not load your account: ${error}`} onRetry={load} />
      ) : account ? (
        <ProfileCard
          fullName={account.fullName}
          email={account.email}
          seenBy="Riders"
          lines={[account.coopName ?? "No coop set"]}
          onSaved={load}
        />
      ) : (
        <LoadingState />
      )}

      <View className="gap-2">
        <SectionLabel>Vehicle</SectionLabel>
        <Card>
          <SettingsRow
            icon={vehicle ? VEHICLE_TYPE_ICONS[vehicle.vehicle_type] : "bus-alert"}
            label={
              vehicle
                ? `${vehicle.plate} · ${VEHICLE_TYPE_LABELS[vehicle.vehicle_type]}`
                : "No vehicle assigned"
            }
            value={
              vehicle
                ? vehicle.route
                  ? `${vehicle.route.terminal.name} → ${vehicle.route.destination_name}. Managed by your coop.`
                  : "No route set by your coop."
                : "Ask your coop to assign your plate to this account."
            }
          />
        </Card>
      </View>

      <View className="gap-2">
        <SectionLabel>Settings</SectionLabel>
        <Card>
          <SettingsRow
            icon="crosshairs-gps"
            label="Location"
            value={permissionValue(
              location,
              "Allowed all the time. Riders see your jeep while you are on a trip.",
              'Set to "Allow all the time" so sharing keeps going with the screen off.',
            )}
            tone={permissionTone(location)}
            onPress={fix(location, askLocation, setLocation)}
            divider
          />
          <SettingsRow
            icon="bell-outline"
            label="Notifications"
            value={permissionValue(
              notifications,
              "Allowed. You get a sound before each drop-off.",
              "Not allowed. Drop-off alerts stay silent.",
            )}
            tone={permissionTone(notifications)}
            onPress={fix(
              notifications,
              () => Notifications.requestPermissionsAsync(),
              setNotifications,
            )}
          />
        </Card>
      </View>

      <View className="gap-2">
        <SectionLabel>About Larga</SectionLabel>
        <Card>
          <SettingsRow icon="information-outline" label="Version" value={VERSION} divider />
          <SettingsRow
            icon="cash"
            label="Fare guide"
            value="LTFRB jeepney rates from Sept 28, 2026, and Naga Ord. 2024-002 for tricycles."
            divider
          />
          <SettingsRow
            icon="shield-check-outline"
            label="Payments"
            value="Riders pay you in their wallet app or in cash. Larga never holds money."
          />
        </Card>
      </View>

      <Button label="Sign out" variant="outline" onPress={onSignOut} />
    </ScrollView>
  );
}
