import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const useSignOut = (): UseMutationResult<void, Error, void> => {
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }
    },
    onError: (error) => {
      console.error("Failed to sign out:", error);
    },
  });
};
