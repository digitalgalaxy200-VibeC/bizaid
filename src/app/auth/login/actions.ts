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
      // Surface the real cause in the server logs; keep the UI message generic.
      // A thrown error inside authorize() (bad env, DB down, UntrustedHost)
      // lands in the default branch, so log it rather than guessing.
      console.error(`[auth] sign-in failed (type=${error.type}):`, (error as any).cause ?? error.message);

      switch (error.type) {
          case "CredentialsSignin":
            return "Invalid email or password. Please check your credentials.";
          case "UntrustedHost":
          case "MissingSecret":
            return "Sign-in is misconfigured on the server. Check auth environment variables.";
          default:
            return "Authentication failed. Please try again.";
        }
    }
    // Next.js redirect errors MUST be re-thrown
    throw error;
  }
}
