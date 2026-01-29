import { GoogleSignInButton } from '@/components/google-sign-in-button/google-sign-in-button';
import { useSignInWithGoogle } from '@/hooks/auth/use-sign-in-with-google';

export function SignIn() {
  const { mutate: signInWithGoogle, isPending, error } = useSignInWithGoogle();

  const handleSignIn = () => {
    signInWithGoogle();
  };

  return (
    <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:min-h-[50vh] tw:gap-6">
      <div className="tw:text-center">
        <h1 className="tw:text-3xl tw:font-bold tw:text-gray-900 tw:dark:text-white tw:mb-2">
          Bienvenido
        </h1>
        <p className="tw:text-gray-600 tw:dark:text-gray-400">Inicia sesión para continuar</p>
      </div>

      <GoogleSignInButton onClick={handleSignIn} isLoading={isPending} />

      {error && (
        <p className="tw:text-red-500 tw:text-sm tw:mt-2">
          No se pudo iniciar sesión. Intenta nuevamente.
        </p>
      )}
    </div>
  );
}
