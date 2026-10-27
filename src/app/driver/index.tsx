import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";

import { VEHICLE_TYPE_LABELS } from "@/components/coop/vehicle-type-chips";
import { FirstTripChecklist } from "@/components/driver/first-trip-checklist";
import { PaymentQrSection } from "@/components/driver/payment-qr-section";
import { FormField } from "@/components/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { useDriverToday } from "@/hooks/use-driver-today";
import { useMyVehicle } from "@/hooks/use-my-vehicle";
import { useSavedFlash } from "@/hooks/use-saved-flash";
import { setFare, setMyPaymentQr, setStatus, type VehicleStatus } from "@/lib/api/driver";
import { colors } from "@/lib/colors";
import { distanceText, metresBetween } from "@/lib/geo";
import { endTrip, isOnTrip, startTrip, type StartTripResult } from "@/lib/trip";
import { type Fare, fareSchema } from "@/lib/validation";

type TripDenied = Exclude<StartTripResult, "started">;
const TRIP_DENIED: Record<TripDenied, string> = {
  "location-denied": "Larga needs your location to share where your vehicle is.",
  "background-denied":
    'Set Location to "Allow all the time" so sharing keeps going with the screen off.',
};

// Status is always spelled out, never color alone. Orange accent only on "Now loading" (Palette A).
const STATUS_LABELS: Record<VehicleStatus, string> = {
  off_duty: "Off duty",
  loading: "Now loading",
  departed: "Departed",
};

const peso = (n: number) => `₱${n.toFixed(2)}`;

// One number with its label, for the Today card.
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
      <Text className="text-center text-sm text-muted">{label}</Text>
    </View>
  );
}

// One obvious next step per stage: Start loading (share location and say so), Depart, End trip.
// The coop's dispatcher buttons remain the way to correct a status from outside.
export default function DriverHome() {
  const { vehicle, loading, error, reload } = useMyVehicle();
  const { passengers, dropPoints, position } = useDriverToday(vehicle?.id);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // null until we know whether a trip is already running (it survives an app restart).
  const [onTrip, setOnTrip] = useState<boolean | null>(null);
  const [tripAction, setTripAction] = useState<"starting" | "ending" | null>(null);
  const [tripDenied, setTripDenied] = useState<TripDenied | null>(null);
  const [fareSaved, flashFareSaved] = useSavedFlash();
  const { control, handleSubmit } = useForm<Fare>({
    resolver: zodResolver(fareSchema),
    values: { fare: vehicle?.driver_fare?.toFixed(2) ?? "" },
    resetOptions: { keepDirtyValues: true }, // a reload after a status tap must not wipe a fare being typed
  });

  // Returns true when the action went through.
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      await reload();
      return true;
    } catch (e) {
      setActionError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  const onSaveFare = handleSubmit(async ({ fare }) => {
    if (await run(() => setFare(Number(fare)))) flashFareSaved();
  });

  useEffect(() => {
    isOnTrip().then(setOnTrip, () => setOnTrip(false));
  }, []);

  // Share location, then say the jeep is loading. A denied permission leaves the status alone.
  const onStartLoading = async () => {
    setTripAction("starting");
    await run(async () => {
      const result = await startTrip();
      setTripDenied(result === "started" ? null : result);
      setOnTrip(result === "started");
      if (result === "started") await setStatus("loading");
    });
    setTripAction(null);
  };

  const onEndTrip = async () => {
    setTripAction("ending");
    await run(async () => {
      // Offline, the GPS still stops but Off duty fails: show what is really running either way.
      try {
        await endTrip();
      } finally {
        setOnTrip(await isOnTrip());
      }
    });
    setTripAction(null);
  };

  if (loading) return <LoadingState />;

  if (error || !vehicle) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="grow items-center justify-center gap-4 p-6"
      >
        {!error && <FirstTripChecklist vehicleAssigned={false} />}
        <Text className={`text-center ${error ? "text-destructive" : "text-foreground"}`}>
          {error ?? "No vehicle assigned yet. Ask your coop."}
        </Text>
        <Button label="Check again" variant="link" onPress={reload} />
      </ScrollView>
    );
  }

  const { route, status } = vehicle;
  const aboveGuide =
    route !== null &&
    vehicle.driver_fare !== null &&
    vehicle.driver_fare > route.guide_fare_regular;
  const sharing = onTrip === true;

  // Nearest drop point by straight line; the sound alert (migration 9) fires at 200 m on the same points.
  const nextDropMetres =
    position && dropPoints.length > 0
      ? Math.min(...dropPoints.map((p) => metresBetween(position, p)))
      : null;
  // Passengers × the fare in force: an estimate, since discounted riders pay less.
  const fareInForce = vehicle.driver_fare ?? route?.guide_fare_regular ?? null;
  const collected = passengers !== null && fareInForce !== null ? passengers * fareInForce : null;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-6"
      keyboardShouldPersistTaps="handled"
    >
      <FirstTripChecklist vehicleAssigned />

      <Card>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-3xl font-bold text-foreground">{vehicle.plate}</Text>
            <Text className="text-muted">{VEHICLE_TYPE_LABELS[vehicle.vehicle_type]}</Text>
            <Text className="mt-2 font-medium text-foreground">
              {route
                ? `${route.terminal.name} → ${route.destination_name}`
                : "No route set by your coop"}
            </Text>
          </View>
          <Badge
            label={STATUS_LABELS[status]}
            variant={status === "loading" ? "accent" : "neutral"}
          />
        </View>

        {onTrip !== null && (
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons
              name={sharing ? "map-marker-radius" : "map-marker-off"}
              size={20}
              color={sharing ? colors.success : colors.muted}
              importantForAccessibility="no"
            />
            <Text className={sharing ? "font-medium text-success" : "text-muted"}>
              {sharing ? "Sharing your location with riders" : "Not sharing your location"}
            </Text>
          </View>
        )}

        {sharing &&
          (dropPoints.length === 0 ? (
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons
                name="map-marker-check-outline"
                size={20}
                color={colors.muted}
                importantForAccessibility="no"
              />
              <Text className="text-muted">No drop-offs ahead</Text>
            </View>
          ) : (
            // The on-screen twin of the drop-off sound: tap to see the points on the Map tab.
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next drop-off, open the map"
              onPress={() => router.navigate("/driver/map")}
              className="min-h-12 flex-row items-center gap-2 active:opacity-80"
            >
              <MaterialCommunityIcons
                name="map-marker-distance"
                size={20}
                color={colors.accent}
                importantForAccessibility="no"
              />
              <Text className="flex-1 font-medium text-foreground">
                {nextDropMetres === null
                  ? `${dropPoints.length} drop-off${dropPoints.length > 1 ? "s" : ""} ahead`
                  : `Next drop-off in about ${distanceText(nextDropMetres)}`}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.muted}
                importantForAccessibility="no"
              />
            </Pressable>
          ))}

        {onTrip !== null &&
          (!sharing ? (
            <>
              <Button
                label="Start loading"
                variant="accent"
                disabled={busy}
                loading={tripAction === "starting"}
                loadingLabel="Starting..."
                onPress={onStartLoading}
              />
              <Text className="text-sm text-muted">
                Shares your location with riders and marks your jeep as now loading.
              </Text>
            </>
          ) : status === "loading" ? (
            <>
              <Button
                label="Depart"
                disabled={busy}
                onPress={() => run(() => setStatus("departed"))}
              />
              <Button
                label="End trip"
                variant="outline"
                disabled={busy}
                loading={tripAction === "ending"}
                loadingLabel="Ending..."
                onPress={onEndTrip}
              />
            </>
          ) : status === "departed" ? (
            <>
              <Button
                label="End trip"
                disabled={busy}
                loading={tripAction === "ending"}
                loadingLabel="Ending..."
                onPress={onEndTrip}
              />
              <Button
                label="Back to loading"
                variant="link"
                disabled={busy}
                onPress={() => run(() => setStatus("loading"))}
              />
            </>
          ) : (
            // Sharing but Off duty: the coop set it, or saving "loading" failed right after Start.
            <>
              <Button
                label="Now loading"
                variant="accent"
                disabled={busy}
                onPress={() => run(() => setStatus("loading"))}
              />
              <Button
                label="End trip"
                variant="outline"
                disabled={busy}
                loading={tripAction === "ending"}
                loadingLabel="Ending..."
                onPress={onEndTrip}
              />
            </>
          ))}
        {tripDenied && (
          <>
            <Text className="text-destructive">{TRIP_DENIED[tripDenied]}</Text>
            <Button label="Open settings" variant="link" onPress={() => Linking.openSettings()} />
          </>
        )}
      </Card>

      <Card>
        <Text className="text-lg font-semibold text-foreground">Today</Text>
        <View className="flex-row gap-2">
          <Stat value={passengers === null ? "–" : String(passengers)} label="Passengers" />
          <Stat
            value={collected === null ? "–" : `₱${Math.round(collected)}`}
            label="Fares, about"
          />
          <Stat value={String(dropPoints.length)} label="Drop-offs ahead" />
        </View>
        <Text className="text-sm text-muted">
          Fares are passengers times your fare; discounted riders pay less. Counts reset at
          midnight.
        </Text>
      </Card>

      <Card>
        <Text className="text-lg font-semibold text-foreground">Fare</Text>
        <FormField
          control={control}
          name="fare"
          label="Your fare (₱)"
          keyboardType="decimal-pad"
          placeholder="15.00"
        />
        {route && (
          <Text className="text-muted">
            Official fare guide: {peso(route.guide_fare_regular)}
            {route.guide_fare_discounted !== null &&
              ` (${peso(route.guide_fare_discounted)} discounted)`}
          </Text>
        )}
        {aboveGuide && (
          <Text className="font-semibold text-destructive">Above the official fare</Text>
        )}
        {route && vehicle.driver_fare !== null && !aboveGuide && (
          <Text className="font-semibold text-success">Matches the official fare</Text>
        )}
        <Button label="Save fare" disabled={busy} onPress={onSaveFare} />
        {fareSaved && <Text className="font-semibold text-success">Saved ✓</Text>}
      </Card>

      <Card>
        <PaymentQrSection
          qr={vehicle.payment_qr}
          fare={fareInForce}
          busy={busy}
          onSave={(qr) => run(() => setMyPaymentQr(qr))}
        />
      </Card>

      {actionError && (
        <Text accessibilityLiveRegion="polite" className="text-destructive">
          {actionError}
        </Text>
      )}
    </ScrollView>
  );
}
