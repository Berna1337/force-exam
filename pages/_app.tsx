import "../styles/globals.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";
import type { AppProps } from "next/app";
import { useMemo } from "react";
import { accentPalette, isLightTheme, PreferencesProvider, usePreferences } from "../contexts/Preferences";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";

function ThemedApp({ Component, pageProps }: AppProps) {
  const { preferences } = usePreferences();
  const colorModeManager = useMemo(() => ({
    type: "localStorage" as const,
    get: () => isLightTheme(preferences.theme) ? "light" as const : "dark" as const,
    set: () => undefined,
  }), [preferences.theme]);
  const theme = useMemo(() => extendTheme({
  colors: { purple: accentPalette(preferences) },
  config: { initialColorMode: "dark", useSystemColorMode: false },
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  styles: { global: { body: { bg: "var(--app-bg)", color: "var(--text)" } } },
  components: {
    Button: { baseStyle: { fontWeight: "500", borderRadius: "8px", _focusVisible: { boxShadow: "0 0 0 2px var(--accent)" } } },
    Input: { defaultProps: { focusBorderColor: "var(--accent-text)" } },
    Textarea: { defaultProps: { focusBorderColor: "var(--accent-text)" } },
  },
}), [preferences]);
  return (
    <ChakraProvider theme={theme} colorModeManager={colorModeManager}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}

export default function App(props: AppProps) {
  return <PreferencesProvider><ThemedApp {...props} /></PreferencesProvider>;
}
