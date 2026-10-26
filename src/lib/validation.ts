import { z } from "zod";

export const signInSchema = z.object({
  // Trim first: Android autocomplete often leaves a trailing space.
  email: z.string().trim().pipe(z.email("Enter a valid email")),
  password: z.string().min(6, "At least 6 characters"),
});

export const signUpSchema = signInSchema.extend({
  // 120 matches the profiles.full_name check in migration 1.
  fullName: z.string().trim().min(1, "Enter your name").max(120, "120 characters at most"),
});

// Kept as text for the input; the 10,000 cap and 2 decimals match set_my_fare in migration 1.
export const fareSchema = z.object({
  fare: z
    .string()
    .trim()
    .regex(/^\d{1,5}(\.\d{1,2})?$/, "Enter an amount like 15 or 15.50")
    .refine((v) => Number(v) <= 10000, "10,000 at most"),
});

export type SignIn = z.infer<typeof signInSchema>;
export type SignUp = z.infer<typeof signUpSchema>;
export type Fare = z.infer<typeof fareSchema>;
