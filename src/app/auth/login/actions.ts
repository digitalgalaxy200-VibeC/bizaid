"use server";

import { signIn } from "@/lib/auth/config";
import { AuthError } from "next-auth";

export async function loginAction(prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      ...Object.fromEntries(formData),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid email or password. Please check your credentials.";
        default:
          return "Authentication failed. Please try again.";
      }
    }
    // Next.js redirect errors MUST be re-thrown
    throw error;
  }
}
