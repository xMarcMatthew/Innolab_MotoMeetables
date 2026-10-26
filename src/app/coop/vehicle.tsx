import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, ScrollView, Text, View } from "react-native";

import { VEHICLE_TYPE_LABELS, VehicleTypeChips } from "@/components/coop/vehicle-type-chips";
import { VehiclePaymentQr } from "@/components/coop/vehicle-payment-qr";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import {
  createVehicle,
  type CoopRoute,
  type Driver,
  getVehiclePaymentQr,
  listMyDrivers,
  listMyRoutes,
  setVehiclePaymentQr,
  updateVehicle,
  type VehicleType,
} from "@/lib/api/coop";
import { vehicleSchema } from "@/lib/validation";

const plateSchema = vehicleSchema.pick({ plate: true });

type Option = { id: string | null; label: string };

// One selectable row per option, "None" first. The selected row says so in text.
function PickList({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="font-medium text-foreground">{label}</Text>
      <ScrollView nestedScrollEnabled className="max-h-64" contentContainerClassName="gap-2">
        {[{ id: null, label: "None" }, ...options].map((o) => (
          <Pressable
            key={o.id ?? "none"}
            accessibilityRole="button"
            accessibilityState={{ selected: o.id === value }}
            onPress={() => onChange(o.id)}
            className={`min-h-12 flex-row items-center justify-between rounded-lg bg-white px-3 py-3 active:opacity-80 ${
              o.id === value ? "border-2 border-primary" : "border border-muted"
            }`}
          >
            <Text className="flex-1 text-foreground">{o.label}</Text>
            {o.id === value && <Text className="font-semibold text-primary">Selected</Text>}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// Add (no params) or edit (id, plate, vehicle_type, route_id, driver_id from the list row).
export default function VehicleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    plate?: string;
    vehicle_type?: VehicleType;
    route_id?: string;
    driver_id?: string;
  }>();
  const editing = params.id !== undefined;
  const [vehicleType, setVehicleType] = useState<VehicleType>(params.vehicle_type ?? "jeepney");
  const [routeId, setRouteId] = useState<string | null>(params.route_id || null);
  const [driverId, setDriverId] = useState<string | null>(params.driver_id || null);
  const [routes, setRoutes] = useState<CoopRoute[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [qr, setQr] = useState<{ payment_qr: string | null; payment_qr_by_driver: boolean }>({
    payment_qr: null,
    payment_qr_by_driver: false,
  });
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { control, handleSubmit } = useForm<{ plate: string }>({
    resolver: zodResolver(plateSchema),
    defaultValues: { plate: params.plate ?? "" },
  });

  useEffect(() => {
    Promise.all([
      listMyRoutes(),
      listMyDrivers(),
      params.id ? getVehiclePaymentQr(params.id) : null,
    ])
      .then(([r, d, q]) => {
        setRoutes(r);
        setDrivers(d);
        if (q) setQr(q);
      })
      .catch((e: Error) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const onSave = handleSubmit(async ({ plate }) => {
    setSaveError(null);
    // Full schema check on what gets sent. The plate is uppercased first.
    const parsed = vehicleSchema.safeParse({
      plate: plate.trim().toUpperCase(),
      vehicle_type: vehicleType,
      route_id: routeId,
      driver_id: driverId,
    });
    if (!parsed.success) {
      setSaveError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (editing) await updateVehicle(params.id!, parsed.data);
      else await createVehicle(parsed.data);
      router.back();
    } catch (e) {
      setSaveError((e as Error).message);
      setBusy(false);
    }
  });

  // Saved straight away, like the driver's screen; the coop's own save is never "by driver".
  async function onSaveQr(next: string | null) {
    setSaveError(null);
    try {
      await setVehiclePaymentQr(params.id!, next);
      setQr({ payment_qr: next, payment_qr_by_driver: false });
    } catch (e) {
      setSaveError((e as Error).message);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-6"
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: editing ? "Edit vehicle" : "Add vehicle" }} />
      <FormField
        control={control}
        name="plate"
        label="Plate number"
        placeholder="ABC 1234"
        autoCapitalize="characters"
      />

      <VehicleTypeChips value={vehicleType} onChange={setVehicleType} />

      {loadError && <Text className="text-destructive">{loadError}</Text>}

      <PickList
        label="Route"
        options={routes.map((r) => ({
          id: r.id,
          label: `${r.terminal_name} → ${r.destination_name} (${VEHICLE_TYPE_LABELS[r.vehicle_type]})`,
        }))}
        value={routeId}
        onChange={setRouteId}
      />
      {routes.length === 0 && !loadError && (
        <Text className="text-muted">No routes yet. Add them from a terminal.</Text>
      )}

      <PickList
        label="Driver"
        options={drivers.map((d) => ({ id: d.id, label: d.full_name ?? "Unnamed driver" }))}
        value={driverId}
        onChange={setDriverId}
      />
      {drivers.length === 0 && !loadError && (
        <Text className="text-muted">No drivers in your coop yet. Ask JM to add them.</Text>
      )}

      {editing && (
        <VehiclePaymentQr qr={qr.payment_qr} byDriver={qr.payment_qr_by_driver} onSave={onSaveQr} />
      )}

      {saveError && <Text className="text-destructive">{saveError}</Text>}

      <Button label="Save vehicle" loading={busy} loadingLabel="Saving..." onPress={onSave} />
    </ScrollView>
  );
}
