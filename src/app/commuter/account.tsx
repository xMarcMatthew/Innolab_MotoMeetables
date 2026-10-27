import Constants from "expo-constants";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Linking, ScrollView, View } from "react-native";

import { ProfileCard } from "@/components/profile-card";
import { signOut } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { SectionLabel } from "@/components/ui/section-label";
import { SettingsRow } from "@/components/ui/settings-row";
import { clearTrips, countTrips } from "@/lib/saved-trips";
import { supabase } from "@/lib/supabase";

const VERSION = Constants.expoConfig?.version ?? "dev";

type Permission = { granted: boolean; canAskAgain: boolean };

// Profile with rename, the two settings a commuter can act on, facts about the app, Sign out.
export default function AccountScreen() {
  const [account, setAccount] = useState<{ fullName: string | null; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Permission | null>(null);
  const [saved, setSaved] = useState(0);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getSession();
    if (!auth.session) return; // the root layout's guard sends logged-out users to sign-in
    // Filter to our own row: a coop user can also read its drivers' profiles.
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", auth.session.user.id)
      .single();
    if (error) return setError(error.message);
    setError(null);
    setAccount({ fullName: data.full_name, email: auth.session.user.email ?? "" });
  }, []);

  // Re-read on focus: the permission changes in the Settings app, saved places change on Home.
  useFocusEffect(
    useCallback(() => {
      load();
      Location.getForegroundPermissionsAsync().then(setLocation);
      countTrips().then(setSaved);
    }, [load]),
  );

  async function onLocation() {
    if (location && !location.granted && location.canAskAgain) {
      setLocation(await Location.requestForegroundPermissionsAsync());
    } else {
      Linking.openSettings();
    }
  }

  function onClearSaved() {
    Alert.alert("Clear saved places?", "The quick trips under the search box on Home go away.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => clearTrips().then(() => setSaved(0)) },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-6">
      {error ? (
        <ErrorState message={`Could not load your account: ${error}`} onRetry={load} />
      ) : account ? (
        <ProfileCard
          fullName={account.fullName}
          email={account.email}
          seenBy="Others"
          onSaved={load}
        />
      ) : (
        <LoadingState />
      )}

      <View className="gap-2">
        <SectionLabel>Settings</SectionLabel>
        <Card>
          <SettingsRow
            icon="crosshairs-gps"
            label="Location"
            value={
              location === null
                ? "Checking..."
                : location.granted
                  ? "Allowed. The terminal nearest you comes first."
                  : "Not allowed. Terminals are not sorted by distance."
            }
            tone={location === null ? undefined : location.granted ? "success" : "destructive"}
            onPress={onLocation}
            divider
          />
          <SettingsRow
            icon="star-outline"
            label="Saved places"
            value={
              saved === 0
                ? "None yet. Places you pick on Home are kept on this phone."
                : `${saved} kept on this phone. Tap to clear.`
            }
            onPress={saved > 0 ? onClearSaved : undefined}
            accessibilityLabel="Clear saved places"
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
            value="Larga never holds money. Pay the driver in your wallet app or in cash."
          />
        </Card>
      </View>

      <Button label="Sign out" variant="outline" onPress={signOut} />
    </ScrollView>
  );
}
