import React from "react";
import {
  Box,
  List,
  ListItem,
  ListIcon,
  Text,
  keyframes,
  useColorModeValue,
  ScaleFade,
  VStack,
  Tooltip,
} from "@chakra-ui/react";
import { TimeIcon, SpinnerIcon } from "@chakra-ui/icons";

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const roadmapItems = [
  {
    text: "Web Application for Customizable JSON-Based Exams.",
    icon: SpinnerIcon,
    color: "blue.500",
    label: "In Progress",
    animation: `${spin} 2s linear infinite`,
  },
  {
    text: "An intuitive Exam Maker for creating JSON-Based Exams with ease.",
    icon: TimeIcon,
    color: "red.500",
    label: "Not Started Yet",
    animation: `${float} 2s ease-in-out infinite`,
  },
  {
    text: "AI-Powered Exam Maker feature for question and answer generation.",
    icon: TimeIcon,
    color: "red.500",
    label: "Not Started Yet",
    animation: `${float} 2s ease-in-out infinite`,
  },
];

export default function Roadmap() {
  const bgColor = useColorModeValue("gray.100", "gray.800");
  const textColor = useColorModeValue("gray.700", "gray.200");

  return (
    <Box p={5} borderRadius="lg" bg={bgColor} color={textColor} boxShadow="2xl">
      <VStack spacing={5} alignItems="flex-start" flex="1">
        <Text fontSize="2xl" fontWeight="bold" mb={4} textAlign="left" fontFamily="'JetBrains Mono', monospace">
          ❯ Project-Roadmap
        </Text>
        <List spacing={2}>
          {roadmapItems.map((item, index) => (
            <ScaleFade key={index} initialScale={0.9} in={true} delay={index * 0.1}>
              <ListItem display="flex" alignItems="center">
                <Tooltip label={item.label} placement="top">
                  <ListIcon as={item.icon} color={item.color} boxSize="16px" animation={item.animation} />
                </Tooltip>
                {item.text}
              </ListItem>
            </ScaleFade>
          ))}
        </List>
      </VStack>
    </Box>
  );
}
