import { z } from "zod";

export const emailSchema = z
    .string()
    .trim()
    .min(5, "Email must be at least 5 characters")
    .max(255, "Email cannot exceed 255 characters")
    .email("Please enter a valid email address")
    .regex(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Invalid email format"
    );

export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password cannot exceed 64 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character");

export const nameSchema = z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long");

export const phoneSchema = z
    .string()
    .trim()
    .transform((val) => val.replace(/[\s()-]/g, "")) // remove spaces, brackets, dashes
    .refine(
        (val) =>
            val === "" ||
            /^\+?[1-9]\d{7,14}$/.test(val),
        {
            message: "Please enter a valid phone number",
        }
    )
    .optional();

export const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
});

export type RegisterFormData = z.infer<typeof registerSchema>;
