import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface SignInWithGoogleResult {
  url: string;
}

export const useSignInWithGoogle = (): UseMutationResult<
  SignInWithGoogleResult,
  Error,
  void
> => {
  return useMutation({
    mutationFn: async (): Promise<SignInWithGoogleResult> => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.url) {
        throw new Error("No redirect URL returned from Google OAuth");
      }

      return { url: data.url };
    },
    onError: (error) => {
      console.error("Failed to sign in with Google:", error);
    },
  });
};
