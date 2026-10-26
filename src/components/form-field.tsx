import { type Control, type FieldValues, type Path, useController } from "react-hook-form";
import { Text, TextInput, type TextInputProps, View } from "react-native";

import { colors } from "@/lib/colors";

type Props<T extends FieldValues> = TextInputProps & {
  control: Control<T>;
  name: Path<T>;
  label: string;
};

export function FormField<T extends FieldValues>({ control, name, label, ...input }: Props<T>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <View className="gap-1">
      <Text className="font-medium text-foreground">{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        {...input}
        accessibilityLabel={label}
        value={field.value}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        // border-border is too faint to outline an input on white; muted keeps the box visible.
        className={`min-h-12 rounded-lg border bg-white px-3 py-3 text-foreground focus:border-2 ${
          fieldState.error ? "border-destructive" : "border-muted focus:border-primary"
        }`}
      />
      {fieldState.error && <Text className="text-destructive">{fieldState.error.message}</Text>}
    </View>
  );
}
