import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

import "../global.css";

import { useAuthContext } from "@/hooks/contexts/use-auth-context";
import { AuthProvider } from "@/contexts/auth-context";
import { SignIn } from "@/containers/auth-flow/sing-in/sing-in";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const unstable_settings = {
  anchor: "(tabs)",
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <RootLayoutContent />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootLayoutContent() {
  const { isLoading, isAuthenticated, isSupabaseConfigured } = useAuthContext();

  if (!isSupabaseConfigured) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-min-h-[50vh] tw-px-6">
        <div className="tw-text-gray-600 tw-text-center">
          Falta configurar Supabase. Define `SUPABASE_URL` y
          `SUPABASE_PUBLISHABLE_KEY` y vuelve a desplegar.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-min-h-[50vh]">
        <div className="tw-text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignIn />;
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
