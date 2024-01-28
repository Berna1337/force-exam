import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { Button, Box, Text, Heading, Container, Link, HStack, Badge, Tooltip } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";

// Blinking caret animation
const blinkCaret = keyframes`
  from, to { border-color: transparent; }
  50% { border-color: orange; }
`;

// Animated gradient keyframes
const gradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const typing = keyframes`
  from { max-width: 0; }
  to { max-width: 100%; }
`;

const GradientTypewriterHeading = styled(Heading)`
  font-family: "JetBrains Mono", monospace;
  font-size: 2rem;
  font-weight: extrabold;
  color: transparent;
  background: linear-gradient(45deg, #4fd1c5, #3bceac, #63b3ed, #7f9cf5);
  background-size: 200% 200%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
  overflow: hidden;
  border-right: 3px solid orange;
  width: 12ch; // Width of the text content
  max-width: 100%; // Max-width to allow growth during animation
  animation:
    ${gradient} 8s ease infinite,
    ${typing} 0.75s steps(120, end) forwards,
    ${blinkCaret} 0.75s step-end infinite 0.75s; // Start blinking after typing
  display: flex; // Use flexbox to center the text and cursor
  justify-content: center; // Center horizontally
  margin: 0 auto; // Center the heading in the container
`;

export default function StartCard() {
  return (
    <Container maxW="2xl" bg="gray.800" color="white" centerContent p={6} borderRadius="2xl">
      <GradientTypewriterHeading as="h1">Force Exam</GradientTypewriterHeading>

      <Text as="cite" fontStyle="italic" fontSize="lg" opacity={0.8} mb={6} mt="26px">
        The most powerful tool to study for your exams!
      </Text>
      <Box padding="4" maxW="md">
        <HStack spacing={4}>
          <Tooltip label="View or Contribute to the Code on GitHub!" aria-label="A tooltip">
            <Link href="https://github.com/Berna1337/force-exam" isExternal target="_blank">
              <Button colorScheme="teal" variant="solid" leftIcon={<FontAwesomeIcon icon={faGithub} />} size="lg">
                View on GitHub
                <ExternalLinkIcon ml={2} />
              </Button>
            </Link>
          </Tooltip>
          <Button colorScheme="gray" variant="solid" size="lg">
            Get Started
          </Button>
        </HStack>
      </Box>
      <Badge
        colorScheme="red"
        variant="subtle"
        p={2}
        borderRadius="full"
        mt={5}
        fontFamily="'JetBrains Mono', monospace"
      >
        In Development
      </Badge>
    </Container>
  );
}
