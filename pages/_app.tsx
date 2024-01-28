import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ChakraProvider, Box } from "@chakra-ui/react";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <Box bg="gray.800" color="white" minHeight="100vh">
        <Component {...pageProps} />
      </Box>
    </ChakraProvider>
  );
}
