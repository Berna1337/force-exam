import { Box, Link, Text } from "@chakra-ui/react";

export default function Footer() {
  return (
    <Box
      as="footer"
      position="fixed"
      bottom={4}
      right={4}
      zIndex={20}
      pointerEvents="none"
    >
      <Link
        href="https://buymeacoffee.com/berna1337"
        isExternal
        fontWeight="semibold"
        color="gray.900"
        bg="yellow.300"
        px={3}
        py={2}
        borderRadius="full"
        _hover={{ bg: "yellow.200", textDecoration: "none" }}
        display="inline-flex"
        alignItems="center"
        gap={2}
        boxShadow="0 8px 18px rgba(0,0,0,0.2)"
        fontSize="sm"
        pointerEvents="auto"
      >
        <Text as="span" fontSize="md" role="img" aria-label="coffee">
          ☕
        </Text>
        Buy me a coffee
      </Link>
    </Box>
  );
}
