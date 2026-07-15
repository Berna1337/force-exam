import { useEffect, useState } from "react";
import Head from "next/head";
import Roadmap from "../components/Roadmap";
import StartCard from "../components/startCard";
import Footer from "../components/Footer";
import ExamRunner from "../components/ExamRunner";
import { Box, VStack, Flex, Container, SimpleGrid, Button, Text, Heading, Stack } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowBackIcon } from "@chakra-ui/icons";

const MotionBox = motion(Box);

export default function Home() {
  const [showActions, setShowActions] = useState(false);
  const [activeFlow, setActiveFlow] = useState<"actions" | "import">("actions");

  const actionOptions = [
    {
      title: "Import Force-Exam",
      description: "Drop in a JSON exam or paste a link to start studying immediately.",
      cta: "Import",
      flow: "import" as const,
    },
    {
      title: "Create Force-Exam",
      description: "Start fresh with a structured template and optional AI suggestions.",
      cta: "Create",
      flow: "create" as const,
    },
  ];

  useEffect(() => {
    if (!showActions) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowActions(false);
        setActiveFlow("actions");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showActions]);

  return (
    <Box bg="#0b0f16" minHeight="100vh" position="relative" overflow="hidden">
      <Head>
        <title>Force Exam</title>
        <meta name="description" content="The best way to study for your Exams!." />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>

      <Box
        position="absolute"
        inset={0}
        opacity={0.28}
        backgroundImage="radial-gradient(circle at 18% 18%, rgba(255,255,255,0.08), transparent 24%), radial-gradient(circle at 80% 10%, rgba(148, 163, 184, 0.08), transparent 22%)"
        filter="blur(46px)"
        pointerEvents="none"
      />

      <Container maxW="7xl" px={{ base: 4, md: 8 }} position="relative" zIndex={1}>
        <Flex direction="column" justify="center" align="center" minHeight="100vh" py={{ base: 10, md: 16 }}>
          <AnimatePresence mode="wait">
            {!showActions ? (
              <MotionBox
                key="landing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                w="full"
              >
                <VStack spacing={10} w="full">
                  <StartCard onGetStarted={() => setShowActions(true)} />
                  <Roadmap />
                </VStack>
              </MotionBox>
            ) : (
              <MotionBox
                key="actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                w="full"
              >
                {activeFlow === "import" ? (
                  <ExamRunner onBack={() => setActiveFlow("actions")} />
                ) : (
                  <Box
                    w="full"
                    bg="rgba(255,255,255,0.06)"
                    border="1px solid"
                    borderColor="whiteAlpha.300"
                    borderRadius="2xl"
                    p={{ base: 6, md: 8 }}
                    boxShadow="0 20px 80px rgba(0, 0, 0, 0.35)"
                    backdropFilter="blur(12px)"
                  >
                    <Stack spacing={4} mb={4} align="flex-start" w="full">
                      <Button
                        leftIcon={<ArrowBackIcon />}
                        variant="outline"
                        colorScheme="cyan"
                        onClick={() => {
                          setShowActions(false);
                          setActiveFlow("actions");
                        }}
                        size="sm"
                        px={3}
                        borderColor="cyan.400"
                        color="white"
                        _hover={{ bg: "cyan.500", color: "gray.900", borderColor: "cyan.500" }}
                      >
                        Back home
                      </Button>
                      <Box>
                        <Text fontSize="lg" color="cyan.200" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.08em">
                          ❯ Choose your path
                        </Text>
                        <Heading size="lg" color="white">
                          Start studying in a few clicks.
                        </Heading>
                      </Box>
                    </Stack>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                      {actionOptions.map((option) => (
                        <Box
                          key={option.title}
                          bg="rgba(255,255,255,0.08)"
                          border="1px solid"
                          borderColor="whiteAlpha.300"
                          borderRadius="xl"
                          p={5}
                          _hover={{ borderColor: "cyan.400", boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}
                          transition="all 0.2s ease"
                        >
                          <Heading size="md" color="white" mb={2}>
                            {option.title}
                          </Heading>
                          <Text color="whiteAlpha.900" mb={4}>
                            {option.description}
                          </Text>
                          <Button
                            colorScheme="cyan"
                            variant="solid"
                            size="md"
                            onClick={() => option.flow === "import" && setActiveFlow("import")}
                            isDisabled={option.flow === "create"}
                          >
                            {option.cta}
                          </Button>
                        </Box>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}
              </MotionBox>
            )}
          </AnimatePresence>
        </Flex>
      </Container>
      <Footer />
    </Box>
  );
}
