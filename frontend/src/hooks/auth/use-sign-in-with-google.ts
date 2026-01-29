import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

interface SignInWithGoogleResult {
  url: string;
}

export const useSignInWithGoogle = (): UseMutationResult<SignInWithGoogleResult, Error, void> => {
  return useMutation({
    mutationFn: async (): Promise<SignInWithGoogleResult> => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) {
        throw new Error('No se pudo iniciar sesión con Google.');
      }

      if (!data.url) {
        throw new Error('No se pudo completar el inicio de sesión con Google.');
      }

      return { url: data.url };
    },
    onError: (error) => {
      console.error('Error al iniciar sesión con Google:', error);
    },
  });
};
