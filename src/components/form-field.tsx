import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { type Control, type FieldValues, type Path, useController } from "react-hook-form";
import { Pressable, Text, TextInput, type TextInputProps, View } from "react-native";

import { colors } from "@/lib/colors";

type Props<T extends FieldValues> = TextInputProps & {
  control: Control<T>;
  name: Path<T>;
  label: string;
};

// A password field (secureTextEntry) gets a hold-to-show eye: the text is readable only while the eye is held.
export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  secureTextEntry,
  ...input
}: Props<T>) {
  const { field, fieldState } = useController({ control, name });
  const [peek, setPeek] = useState(false);
  return (
    <View className="gap-1">
      <Text className="font-medium text-foreground">{label}</Text>
      <View className="relative">
        <TextInput
          placeholderTextColor={colors.muted}
          {...input}
          secureTextEntry={secureTextEntry && !peek}
          accessibilityLabel={label}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          // border-border is too faint to outline an input on white; muted keeps the box visible.
          className={`min-h-12 rounded-lg border bg-white px-3 py-3 text-foreground focus:border-2 ${
            secureTextEntry ? "pr-12" : ""
          } ${fieldState.error ? "border-destructive" : "border-muted focus:border-primary"}`}
        />
        {secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={peek ? "Showing password" : "Hold to show password"}
            onPressIn={() => setPeek(true)}
            onPressOut={() => setPeek(false)}
            className="absolute right-0 top-0 size-12 items-center justify-center active:opacity-80"
          >
            <MaterialCommunityIcons
              name={peek ? "eye-off" : "eye"}
              size={22}
              color={colors.muted}
            />
          </Pressable>
        )}
      </View>
      {fieldState.error && (
        <Text accessibilityLiveRegion="polite" className="text-destructive">
          {fieldState.error.message}
        </Text>
      )}
    </View>
  );
}
