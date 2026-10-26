import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";

import { VEHICLE_TYPE_LABELS } from "@/components/coop/vehicle-type-chips";
import { FirstTripChecklist } from "@/components/driver/first-trip-checklist";
import { PaymentQrSection } from "@/components/driver/payment-qr-section";
import { FormField } from "@/components/form-field";
import { useMyVehicle } from "@/hooks/use-my-vehicle";
import { setFare, setMyPaymentQr, setStatus, type VehicleStatus } from "@/lib/api/driver";
import { endTrip, isOnTrip, startTrip, type StartTripResult } from "@/lib/trip";
import { type Fare, fareSchema } from "@/lib/validation";

type TripDenied = Exclude<StartTripResult, "started">;
const TRIP_DENIED: Record<TripDenied, string> = {
  "location-denied": "Larga needs your location to share where your vehicle is.",
  "background-denied":
    'Set Location to "Allow all the time" so sharing keeps going with the screen off.',
};

// Status is always spelled out, never color alone. Orange accent only on "Now loading" (Palette A).
const STATUSES: { status: VehicleStatus; label: string; button: string; text: string }[] = [
  { status: "loading", label: "Now loading", button: "bg-accent", text: "text-white" },
  { status: "departed", label: "Departed", button: "bg-primary", text: "text-white" },
  {
    status: "off_duty",
    label: "Off duty",
    button: "border border-muted bg-white",
    text: "text-foreground",
  },
];

const peso = (n: number) => `₱${n.toFixed(2)}`;

export default function DriverHome() {
  const { vehicle, loading, error, reload } = useMyVehicle();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // null until we know whether a trip is already running (it survives an app restart).
  const [onTrip, setOnTrip] = useState<boolean | null>(null);
  const [tripDenied, setTripDenied] = useState<TripDenied | null>(null);
  const { control, handleSubmit } = useForm<Fare>({
    resolver: zodResolver(fareSchema),
    values: { fare: vehicle?.driver_fare?.toFixed(2) ?? "" },
    resetOptions: { keepDirtyValues: true }, // a reload after a status tap must not wipe a fare being typed
  });

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      await reload();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const onSaveFare = handleSubmit(({ fare }) => run(() => setFare(Number(fare))));

  useEffect(() => {
    isOnTrip().then(setOnTrip, () => setOnTrip(false));
  }, []);

  const onStartTrip = () =>
    run(async () => {
      const result = await startTrip();
      setTripDenied(result === "started" ? null : result);
      setOnTrip(result === "started");
    });

  const onEndTrip = () =>
    run(async () => {
      await endTrip();
      setOnTrip(false);
    });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !vehicle) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
        {!error && <FirstTripChecklist vehicleAssigned={false} />}
        <Text className={`text-center ${error ? "text-destructive" : "text-foreground"}`}>
          {error ?? "No vehicle assigned yet. Ask your coop."}
        </Text>
        <Pressable accessibilityRole="button" onPress={reload}>
          <Text className="font-semibold text-primary">Check again</Text>
        </Pressable>
      </View>
    );
  }

  const { route } = vehicle;
  const aboveGuide =
    route !== null &&
    vehicle.driver_fare !== null &&
    vehicle.driver_fare > route.guide_fare_regular;
  const current = STATUSES.find((s) => s.status === vehicle.status);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 p-6"
      keyboardShouldPersistTaps="handled"
    >
      <FirstTripChecklist vehicleAssigned />
      <View className="gap-1">
        <Text className="text-2xl font-bold text-foreground">
          {vehicle.plate} · {VEHICLE_TYPE_LABELS[vehicle.vehicle_type]}
        </Text>
        <Text className="text-muted">
          {route
            ? `${route.terminal.name} → ${route.destination_name}`
            : "No route set by your coop"}
        </Text>
      </View>

      {onTrip !== null && (
        <View className="gap-2">
          {onTrip ? (
            <>
              <Text className="font-semibold text-foreground">
                On a trip: sharing your location
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={onEndTrip}
                className="items-center rounded-lg border border-muted bg-white py-3"
              >
                <Text className="font-semibold text-foreground">End trip</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={onStartTrip}
              className="items-center rounded-lg bg-accent py-3"
            >
              <Text className="font-semibold text-white">Start trip</Text>
            </Pressable>
          )}
          {tripDenied && (
            <>
              <Text className="text-destructive">{TRIP_DENIED[tripDenied]}</Text>
              <Pressable accessibilityRole="button" onPress={() => Linking.openSettings()}>
                <Text className="font-semibold text-primary">Open settings</Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      <View className="gap-3">
        <Text className="text-lg font-semibold text-foreground">Status: {current?.label}</Text>
        <View className="flex-row gap-2">
          {STATUSES.map((s) => (
            <Pressable
              key={s.status}
              accessibilityRole="button"
              accessibilityState={{ selected: s.status === vehicle.status, disabled: busy }}
              disabled={busy}
              onPress={() => run(() => setStatus(s.status))}
              className={`flex-1 items-center rounded-lg py-3 ${s.button}`}
            >
              <Text className={`font-semibold ${s.text}`}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-3">
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
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={onSaveFare}
          className="items-center rounded-lg bg-primary py-3"
        >
          <Text className="font-semibold text-white">Save fare</Text>
        </Pressable>
      </View>

      <PaymentQrSection
        qr={vehicle.payment_qr}
        fare={vehicle.driver_fare ?? route?.guide_fare_regular ?? null}
        busy={busy}
        onSave={(qr) => run(() => setMyPaymentQr(qr))}
      />

      {actionError && <Text className="text-destructive">{actionError}</Text>}
    </ScrollView>
  );
}
