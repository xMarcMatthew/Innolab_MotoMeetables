import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";

import { PinPicker } from "@/components/coop/pin-picker";
import { VehicleTypeChips } from "@/components/coop/vehicle-type-chips";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { createRoute, updateRoute, type VehicleType } from "@/lib/api/coop";
import { routeFieldsSchema, routeSchema } from "@/lib/validation";

type Fields = {
  destination_name: string;
  guide_fare_regular: string;
  guide_fare_discounted: string;
};

// Add (terminalId only) or edit (all route fields from the list row).
export default function RouteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    terminalId: string;
    id?: string;
    destination_name?: string;
    destination_lat?: string;
    destination_lng?: string;
    vehicle_type?: VehicleType;
    guide_fare_regular?: string;
    guide_fare_discounted?: string;
  }>();
  const editing = params.id !== undefined;
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    editing ? { lat: Number(params.destination_lat), lng: Number(params.destination_lng) } : null,
  );
  const [vehicleType, setVehicleType] = useState<VehicleType>(params.vehicle_type ?? "jeepney");
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [noPin, setNoPin] = useState(false);
  const { control, handleSubmit } = useForm<Fields>({
    resolver: zodResolver(routeFieldsSchema),
    defaultValues: {
      destination_name: params.destination_name ?? "",
      guide_fare_regular: params.guide_fare_regular ?? "",
      guide_fare_discounted: params.guide_fare_discounted ?? "",
    },
  });

  const onSave = handleSubmit(async (f) => {
    setSaveError(null);
    if (!pin) {
      setNoPin(true);
      return;
    }
    // Full schema check on the numbers that get sent.
    const parsed = routeSchema.safeParse({
      destination_name: f.destination_name,
      destination_lat: pin.lat,
      destination_lng: pin.lng,
      vehicle_type: vehicleType,
      guide_fare_regular: Number(f.guide_fare_regular),
      guide_fare_discounted:
        f.guide_fare_discounted === "" ? null : Number(f.guide_fare_discounted),
    });
    if (!parsed.success) {
      setSaveError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (editing) await updateRoute(params.id!, parsed.data);
      else await createRoute(params.terminalId, parsed.data);
      router.back();
    } catch (e) {
      setSaveError((e as Error).message);
      setBusy(false);
    }
  });

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-6"
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: editing ? "Edit route" : "Add route" }} />
      <FormField
        control={control}
        name="destination_name"
        label="Destination name"
        placeholder="Pacol"
      />

      <View className="gap-2">
        <Text className="font-medium text-foreground">
          Destination: tap the map to place the pin
        </Text>
        <PinPicker
          pin={pin}
          onPick={(p) => {
            setPin(p);
            setNoPin(false);
          }}
        />
        <Text className="text-muted">
          {pin ? `Lat ${pin.lat.toFixed(6)}, Lng ${pin.lng.toFixed(6)}` : "No pin yet"}
        </Text>
        {noPin && <Text className="text-destructive">Tap the map to place the pin</Text>}
      </View>

      <VehicleTypeChips value={vehicleType} onChange={setVehicleType} />

      <FormField
        control={control}
        name="guide_fare_regular"
        label="Official regular fare (₱)"
        keyboardType="decimal-pad"
        placeholder="15.00"
      />
      <FormField
        control={control}
        name="guide_fare_discounted"
        label="Official discounted fare (₱, optional)"
        keyboardType="decimal-pad"
        placeholder="12.00"
      />

      {saveError && <Text className="text-destructive">{saveError}</Text>}

      <Button label="Save route" loading={busy} loadingLabel="Saving..." onPress={onSave} />
    </ScrollView>
  );
}
