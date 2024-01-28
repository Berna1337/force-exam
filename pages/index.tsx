import Head from "next/head";
import StartCard from "../components/startCard";
import { useState } from "react";
import { useRouter } from "next/router";
import { Center, Box } from "@chakra-ui/react";

export default function Home() {
  return (
    <div>
      <Head>
        <title>Force Exam</title>
        <meta name="description" content="The best way to study for your Exams!." />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>
      <Box bg="gray.800" color="white" minHeight="100vh">
        <Center h="420px">
          <StartCard />
        </Center>
      </Box>
    </div>
  );
}
