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

export type SignIn = z.infer<typeof signInSchema>;
export type SignUp = z.infer<typeof signUpSchema>;
