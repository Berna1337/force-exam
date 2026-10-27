import "../styles/globals.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";
import type { AppProps } from "next/app";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  config: { initialColorMode: "dark", useSystemColorMode: false },
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  styles: { global: { body: { bg: "#1e1e1e", color: "#d4d4d4" } } },
  components: {
    Button: { baseStyle: { fontWeight: "500", borderRadius: "5px", _focusVisible: { boxShadow: "0 0 0 2px #a78bfa" } } },
    Input: { defaultProps: { focusBorderColor: "purple.400" } },
    Textarea: { defaultProps: { focusBorderColor: "purple.400" } },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme} colorModeManager={{ type: "localStorage", get: () => "dark", set: () => undefined }}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}
