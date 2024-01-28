import Head from "next/head";
import StartCard from "../components/startCard";
import Roadmap from "../components/Roadmap";
import { Box, VStack, Flex } from "@chakra-ui/react";

export default function Home() {
  return (
    <Box bg="gray.800" minHeight="100vh">
      <Head>
        <title>Force Exam</title>
        <meta name="description" content="The best way to study for your Exams!." />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>

      <Flex direction="column" justify="center" align="center" height="100vh" minWidth="min-content">
        <VStack spacing={8}>
          <StartCard />
          <Roadmap />
        </VStack>
      </Flex>
    </Box>
  );
}
