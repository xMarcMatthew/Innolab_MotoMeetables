import { z } from "zod";

export const signInSchema = z.object({
  // Trim first: Android autocomplete often leaves a trailing space.
  email: z.string().trim().pipe(z.email("Enter a valid email")),
  password: z.string().min(6, "At least 6 characters"),
});

// Shown as a live checklist under the sign-up password field; the schema is built from the same list.
export const PASSWORD_RULES: { label: string; test: (password: string) => boolean }[] = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  { label: "Uppercase", test: (p) => /[A-Z]/.test(p) },
  { label: "Number", test: (p) => /\d/.test(p) },
  { label: "Symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const signUpSchema = z
  .object({
    // 120 matches the profiles.full_name check in migration 1.
    fullName: z.string().trim().min(1, "Enter your name").max(120, "120 characters at most"),
    email: signInSchema.shape.email,
    password: PASSWORD_RULES.reduce<z.ZodString>(
      (schema, rule) => schema.refine(rule.test, "Meet every rule below"),
      z.string(),
    ),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Kept as text for the input; the 10,000 cap and 2 decimals match set_my_fare in migration 1.
export const fareSchema = z.object({
  fare: z
    .string()
    .trim()
    .regex(/^\d{1,5}(\.\d{1,2})?$/, "Enter an amount like 15 or 15.50")
    .refine((v) => Number(v) <= 10000, "10,000 at most"),
});

// Name 1 to 120 and the lat/lng ranges match the terminals checks in migration 1.
export const terminalSchema = z.object({
  name: z.string().trim().min(1, "Enter a terminal name").max(120, "120 characters at most"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const VEHICLE_TYPES = ["jeepney", "modern_jeepney", "tricycle", "bus"] as const;

// Route form fields as typed (text). Fare limits and the destination name length match the routes checks in migration 1.
export const routeFieldsSchema = z
  .object({
    destination_name: z
      .string()
      .trim()
      .min(1, "Enter a destination")
      .max(120, "120 characters at most"),
    guide_fare_regular: fareSchema.shape.fare,
    guide_fare_discounted: fareSchema.shape.fare.or(z.literal("")),
  })
  .refine(
    (v) =>
      v.guide_fare_discounted === "" ||
      Number(v.guide_fare_discounted) <= Number(v.guide_fare_regular),
    { message: "Not above the regular fare", path: ["guide_fare_discounted"] },
  );

// What gets sent: numbers, plus the pin and type that are not text inputs.
export const routeSchema = z.object({
  destination_name: z.string().trim().min(1).max(120),
  destination_lat: z.number().min(-90).max(90),
  destination_lng: z.number().min(-180).max(180),
  vehicle_type: z.enum(VEHICLE_TYPES),
  guide_fare_regular: z.number().min(0).max(10000),
  guide_fare_discounted: z.number().min(0).max(10000).nullable(),
});

export const VEHICLE_STATUSES = ["off_duty", "loading", "departed"] as const;

// Plate 1 to 20 matches the vehicles check in migration 1; the form uppercases it before this runs.
export const vehicleSchema = z.object({
  plate: z
    .string()
    .trim()
    .min(1, "Enter a plate number")
    .max(20, "20 characters at most")
    .regex(/^[A-Za-z0-9 -]+$/, "Letters, digits, spaces and dashes only"),
  vehicle_type: z.enum(VEHICLE_TYPES),
  route_id: z.uuid().nullable(),
  driver_id: z.uuid().nullable(),
});

export const vehicleStatusSchema = z.enum(VEHICLE_STATUSES);

export type SignIn = z.infer<typeof signInSchema>;
export type SignUp = z.infer<typeof signUpSchema>;
export type Fare = z.infer<typeof fareSchema>;
