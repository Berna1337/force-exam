import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { Button, Box, Text, Heading, Container, Link, HStack, Badge, Tooltip } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";

export default function StartCard() {
  return (
    <Container maxW="2xl" bg="gray.800" color="white" centerContent p={6} borderRadius="2xl">
      <Heading
        as="h2"
        size="2xl"
        mb={4}
        fontWeight="extrabold"
        letterSpacing="tight"
        lineHeight="shorter"
        color="teal.300"
      >
        Force Exam
      </Heading>
      <Text as="cite" fontStyle="italic" fontSize="lg" opacity={0.8} mb={6}>
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
            Start
          </Button>
        </HStack>
      </Box>
      <Badge colorScheme="red" variant="subtle" p={2} borderRadius="full" mt={5}>
        In Development
      </Badge>
    </Container>
  );
}
