import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Linking, ScrollView, Text, View } from "react-native";

import { VEHICLE_TYPE_LABELS } from "@/components/coop/vehicle-type-chips";
import { FirstTripChecklist } from "@/components/driver/first-trip-checklist";
import { PaymentQrSection } from "@/components/driver/payment-qr-section";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { useMyVehicle } from "@/hooks/use-my-vehicle";
import { useSavedFlash } from "@/hooks/use-saved-flash";
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
const STATUSES: {
  status: VehicleStatus;
  label: string;
  variant: "accent" | "primary" | "outline";
}[] = [
  { status: "loading", label: "Now loading", variant: "accent" },
  { status: "departed", label: "Departed", variant: "primary" },
  { status: "off_duty", label: "Off duty", variant: "outline" },
];

const peso = (n: number) => `₱${n.toFixed(2)}`;

export default function DriverHome() {
  const { vehicle, loading, error, reload } = useMyVehicle();
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

  const onStartTrip = async () => {
    setTripAction("starting");
    await run(async () => {
      const result = await startTrip();
      setTripDenied(result === "started" ? null : result);
      setOnTrip(result === "started");
    });
    setTripAction(null);
  };

  const onEndTrip = async () => {
    setTripAction("ending");
    await run(async () => {
      await endTrip();
      setOnTrip(false);
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
              <Button
                label="End trip"
                variant="outline"
                disabled={busy}
                loading={tripAction === "ending"}
                loadingLabel="Ending..."
                onPress={onEndTrip}
              />
            </>
          ) : (
            <Button
              label="Start trip"
              variant="accent"
              disabled={busy}
              loading={tripAction === "starting"}
              loadingLabel="Starting..."
              onPress={onStartTrip}
            />
          )}
          {tripDenied && (
            <>
              <Text className="text-destructive">{TRIP_DENIED[tripDenied]}</Text>
              <Button label="Open settings" variant="link" onPress={() => Linking.openSettings()} />
            </>
          )}
        </View>
      )}

      <View className="gap-3">
        <Text className="text-lg font-semibold text-foreground">Status: {current?.label}</Text>
        <View className="flex-row gap-2">
          {STATUSES.map((s) => {
            const selected = s.status === vehicle.status;
            return (
              // The selected status gets a heavy outline and a check mark: never color alone.
              <View
                key={s.status}
                className={`flex-1 rounded-xl border-4 ${
                  selected ? "border-foreground" : "border-transparent opacity-70"
                }`}
              >
                <Button
                  label={selected ? `✓ ${s.label}` : s.label}
                  variant={s.variant}
                  disabled={busy}
                  onPress={() => run(() => setStatus(s.status))}
                />
              </View>
            );
          })}
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
        <Button label="Save fare" disabled={busy} onPress={onSaveFare} />
        {fareSaved && <Text className="font-semibold text-foreground">Saved ✓</Text>}
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
