import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import {
  Button,
  Box,
  Text,
  Heading,
  Container,
  Link,
  HStack,
  Badge,
  Tooltip,
  Stack,
  SimpleGrid,
} from "@chakra-ui/react";
import { ArrowForwardIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";

const blinkCaret = keyframes`
  from, to { border-color: transparent; }
  50% { border-color: orange; }
`;

const gradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const typing = keyframes`
  from { max-width: 0; }
  to { max-width: 100%; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.45; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.05); }
`;

const holoSheen = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const ctaPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.35); }
  60% { box-shadow: 0 0 0 16px rgba(56, 189, 248, 0); }
  100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
`;

const GlowShell = styled(Box)`
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(18px);
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.4);

  &::before,
  &::after {
    content: "";
    position: absolute;
    inset: -40%;
    pointer-events: none;
  }

  &::before {
    background: conic-gradient(from 180deg, #38bdf8, #6366f1, #22c55e, #38bdf8);
    opacity: 0.12;
    filter: blur(42px);
    animation: ${pulse} 14s ease-in-out infinite;
  }

  &::after {
    inset: -10%;
    background: linear-gradient(
      120deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(56, 189, 248, 0.18) 20%,
      rgba(236, 72, 153, 0.16) 45%,
      rgba(94, 234, 212, 0.18) 65%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 200% 200%;
    mix-blend-mode: screen;
    opacity: 0.55;
    filter: blur(12px);
    animation: ${holoSheen} 18s ease-in-out infinite;
  }
`;

const GradientTypewriterHeading = styled(Heading)`
  font-family: "JetBrains Mono", monospace;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  color: transparent;
  background: linear-gradient(45deg, #e0f2fe, #a5f3fc, #c4b5fd, #93c5fd);
  background-size: 200% 200%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
  overflow: hidden;
  border-right: 3px solid #38bdf8;
  width: 12ch;
  max-width: 100%;
  animation:
    ${gradient} 8s ease infinite,
    ${typing} 0.75s steps(120, end) forwards,
    ${blinkCaret} 0.75s step-end infinite 0.75s;
  display: inline-flex;
  justify-content: center;
`;

type StartCardProps = {
  onGetStarted?: () => void;
};

export default function StartCard({ onGetStarted }: StartCardProps) {
  return (
      <Container maxW="6xl" centerContent py={{ base: 10, md: 16 }}>
          <GlowShell
              w="full"
              borderRadius="2xl"
              p={{ base: 6, md: 10 }}
              color="white"
              position="relative"
              overflow="hidden"
          >
              <Box
                  position="absolute"
                  inset={1}
                  borderRadius="xl"
                  backgroundImage="radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 30%), radial-gradient(circle at 80% 0%, rgba(56,189,248,0.08), transparent 28%), radial-gradient(circle at 30% 80%, rgba(99,102,241,0.08), transparent 30%)"
                  opacity={0.75}
                  filter="blur(12px)"
                  pointerEvents="none"
              />
              <Stack
                  direction="column"
                  spacing={8}
                  align="stretch"
                  zIndex={1}
                  position="relative"
                  maxW="4xl"
              >
                  <Stack spacing={5} flex="1">
                      <HStack spacing={3} alignItems="center">
                          <Badge
                              colorScheme="cyan"
                              variant="solid"
                              borderRadius="full"
                              px={3}
                              py={1}
                          >
                              Live prototype
                          </Badge>
                          <Badge
                              colorScheme="yellow"
                              variant="outline"
                              borderRadius="full"
                              px={3}
                              py={1}
                              borderColor="yellow.300"
                          >
                              In Development
                          </Badge>
                      </HStack>

                      <GradientTypewriterHeading as="h1">
                          Force Exam
                      </GradientTypewriterHeading>

                      <Text
                          fontSize={{ base: 'lg', md: 'xl' }}
                          opacity={0.92}
                          lineHeight="1.6"
                      >
                          Craft realistic, JSON-native practice exams. Study
                          your own sets or shared decks, while AI suggests new
                          questions, reviews misses, and surfaces weak spots so
                          every session moves you forward.
                      </Text>

                      <HStack spacing={4} flexWrap="wrap">
                          <Button
                              size="lg"
                              fontFamily="'JetBrains Mono', monospace"
                              bgGradient="linear(to-r, cyan.400, teal.300, blue.400)"
                              color="gray.900"
                              px={6}
                              py={6}
                              borderRadius="full"
                              rightIcon={<ArrowForwardIcon />}
                              boxShadow="0 12px 35px rgba(56, 189, 248, 0.35)"
                              animation={`${ctaPulse} 2.8s ease-in-out infinite`}
                              _hover={{
                                  bgGradient:
                                      'linear(to-r, cyan.300, teal.200, blue.300)',
                                  transform: 'translateY(-2px) scale(1.01)',
                                  boxShadow:
                                      '0 18px 42px rgba(56, 189, 248, 0.45)',
                              }}
                              _active={{
                                  transform: 'translateY(0)',
                                  boxShadow:
                                      '0 10px 28px rgba(56, 189, 248, 0.35)',
                              }}
                              onClick={onGetStarted}
                          >
                              Get Started
                          </Button>
                          <Tooltip
                              label="View or contribute to the project on GitHub!"
                              aria-label="GitHub tooltip"
                          >
                              <Link
                                  href="https://github.com/Berna1337/force-exam"
                                  isExternal
                                  target="_blank"
                              >
                                  <Button
                                      colorScheme="cyan"
                                      variant="solid"
                                      size="lg"
                                      leftIcon={
                                          <FontAwesomeIcon icon={faGithub} />
                                      }
                                      fontFamily="'JetBrains Mono', monospace"
                                      bg="cyan.500"
                                      color="gray.900"
                                      _hover={{ bg: 'cyan.400' }}
                                  >
                                      View on GitHub
                                  <ExternalLinkIcon ml={2} />
                              </Button>
                          </Link>
                      </Tooltip>
                      </HStack>

                      <SimpleGrid
                          columns={{ base: 1, sm: 3 }}
                          spacing={4}
                          pt={4}
                      >
                          {[
                              {
                                  label: 'Offline-first JSON',
                                  detail: 'Keep exams portable',
                              },
                              {
                                  label: 'AI assist',
                                  detail: 'Suggest, expand, review misses',
                              },
                              {
                                  label: 'Study-ready',
                                  detail: 'Track weak areas & retakes',
                              },
                          ].map((item) => (
                              <Box
                                  key={item.label}
                                  bg="whiteAlpha.100"
                                  border="1px solid"
                                  borderColor="whiteAlpha.200"
                                  borderRadius="lg"
                                  p={3}
                                  backdropFilter="blur(6px)"
                              >
                                  <Text fontWeight="semibold" fontSize="sm">
                                      {item.label}
                                  </Text>
                                  <Text fontSize="sm" opacity={0.8}>
                                      {item.detail}
                                  </Text>
                              </Box>
                          ))}
                      </SimpleGrid>
                  </Stack>
              </Stack>
          </GlowShell>
      </Container>
  );
}
