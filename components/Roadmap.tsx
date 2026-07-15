import React from "react";
import {
  Box,
  Text,
  keyframes,
  VStack,
  Badge,
  Stack,
  HStack,
  Flex,
} from "@chakra-ui/react";
import { TimeIcon, TriangleUpIcon } from "@chakra-ui/icons";

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

const roadmapItems = [
  {
    text: "Import and practice JSON-based exams in the browser.",
    status: "In progress",
    icon: TriangleUpIcon,
    color: "cyan.300",
    detail: "Paste exam JSON, answer questions, finish, and review misses locally.",
    highlight: "MVP",
  },
  {
    text: "Intuitive exam maker for building JSON exams with ease.",
    status: "Queued",
    icon: TimeIcon,
    color: "orange.300",
    detail: "Visual builder, templates, and schema validation.",
    highlight: "Designing UX",
  },
  {
    text: "AI-powered exam maker for assisted question generation.",
    status: "Upcoming",
    icon: TimeIcon,
    color: "purple.300",
    detail: "Prompted question banks and AI-driven review suggestions.",
    highlight: "Researching",
  },
];

export default function Roadmap() {
  return (
    <Box
      w="full"
      bg="rgba(255,255,255,0.02)"
      border="1px solid"
      borderColor="whiteAlpha.200"
      borderRadius="2xl"
      p={{ base: 6, md: 8 }}
      boxShadow="0 20px 80px rgba(0, 0, 0, 0.35)"
      backdropFilter="blur(12px)"
    >
      <Flex align={{ base: "flex-start", md: "center" }} justify="space-between" mb={6} gap={4}>
        <Box>
          <Text fontSize="lg" color="cyan.200" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.08em">
            ❯ Project Roadmap
          </Text>
        </Box>
        <Badge colorScheme="gray" variant="outline" borderRadius="full" px={3} py={1} borderColor="whiteAlpha.300">
          Current snapshot
        </Badge>
      </Flex>

      <Stack spacing={6} position="relative" _before={{
        content: '""',
        position: "absolute",
        left: "16px",
        top: "6px",
        bottom: "6px",
        borderLeft: "1px dashed",
        borderColor: "whiteAlpha.400",
        opacity: 0.8,
      }}>
        {roadmapItems.map((item, index) => (
          <HStack key={item.text} spacing={5} align="flex-start" pl={10}>
            <Box position="absolute" left="8px" mt="6px">
              <Box
                w={3.5}
                h={3.5}
                borderRadius="full"
                bgGradient={`linear(to-br, ${item.color}, whiteAlpha.900)`}
                boxShadow={`0 0 0 6px rgba(255,255,255,0.06), 0 10px 30px -10px ${item.color}`}
                animation={index === 0 ? `${float} 3s ease-in-out infinite` : undefined}
              />
            </Box>

            <VStack align="flex-start" spacing={2} bg="whiteAlpha.50" border="1px solid" borderColor="whiteAlpha.200" borderRadius="xl" p={4} w="full">
              <HStack spacing={3} align="center">
                {index === 0 ? (
                  <TriangleUpIcon color={item.color} boxSize={4} />
                ) : (
                  <TimeIcon color={item.color} boxSize={4} />
                )}
                <Text fontWeight="semibold" color="white">
                  {item.text}
                </Text>
                <Badge colorScheme="whiteAlpha" variant="subtle" borderRadius="full" px={3} py={1} color={item.color}>
                  {item.status}
                </Badge>
              </HStack>
              <Text color="whiteAlpha.800">{item.detail}</Text>
              <HStack spacing={3} flexWrap="wrap">
                <Badge colorScheme="gray" variant="outline" borderRadius="full" px={3} py={1} borderColor="whiteAlpha.300" color={item.color}>
                  {item.highlight}
                </Badge>
                {index === 0 && (
                  <Badge colorScheme="cyan" variant="solid" borderRadius="full" px={3} py={1} bg="cyan.500" color="gray.900">
                    On it now
                  </Badge>
                )}
                {index > 0 && (
                  <Badge colorScheme="gray" variant="outline" borderRadius="full" px={3} py={1} borderColor="whiteAlpha.400">
                    Next
                  </Badge>
                )}
              </HStack>
            </VStack>
          </HStack>
        ))}
      </Stack>
    </Box>
  );
}
