import { useEffect, useState } from "react";
import { AddIcon, EditIcon, HamburgerIcon, QuestionOutlineIcon, ViewIcon } from "@chakra-ui/icons";
import {
  Box, Button, Flex, HStack, IconButton, Menu, MenuButton, MenuItem, MenuList,
  Text, Tooltip, useDisclosure,
} from "@chakra-ui/react";
import AppHelp from "./AppHelp";

type Props = {
  title: string;
  onBackup: () => void;
  onSettings: () => void;
  onDashboard: () => void;
  onCreate: () => void;
  onImport: () => void;
  onWorkspace: () => void;
  onToggleSidebar: () => void;
};

export default function TitleBar({ title, onSettings, onBackup, onDashboard, onCreate, onImport, onWorkspace, onToggleSidebar }: Props) {
  const [macDesktop, setMacDesktop] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    setMacDesktop(/Electron\//.test(navigator.userAgent) && /Mac/.test(navigator.platform));
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "F1") { event.preventDefault(); onOpen(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onOpen]);

  return <>
    <Box as="header" className="app-titlebar" data-mac={macDesktop ? "true" : "false"} h="38px" minH="38px" bg="var(--chrome)" borderBottom="1px solid var(--border)" userSelect="none">
      <Flex className="titlebar-content" h="full" align="center" px={2} gap={1}>
        <Text aria-hidden="true" color="var(--accent-text)" fontSize="17px" px={2}>◇</Text>
        <HStack as="nav" aria-label="Application menu" spacing={0} flexShrink={0}>
          <Menu><MenuButton as={Button} size="xs" variant="ghost" fontWeight="400" px={2}>File</MenuButton><MenuList bg="var(--surface)" borderColor="var(--border)" fontSize="sm">
            <MenuItem bg="var(--surface)" icon={<EditIcon />} onClick={onCreate}>Create exam</MenuItem>
            <MenuItem bg="var(--surface)" icon={<AddIcon />} command="Ctrl / ⌘ O" onClick={onImport}>Import exam</MenuItem>
            <MenuItem bg="var(--surface)" onClick={onBackup}>Backup and restore</MenuItem>
          </MenuList></Menu>
          <Menu><MenuButton as={Button} size="xs" variant="ghost" fontWeight="400" px={2}>View</MenuButton><MenuList bg="var(--surface)" borderColor="var(--border)" fontSize="sm">
            <MenuItem bg="var(--surface)" icon={<ViewIcon />} onClick={onWorkspace}>Workspace</MenuItem>
            <MenuItem bg="var(--surface)" onClick={onDashboard}>Progress dashboard</MenuItem>
            <MenuItem bg="var(--surface)" onClick={onSettings}>Settings</MenuItem>
            <MenuItem bg="var(--surface)" icon={<HamburgerIcon />} command={"Ctrl / ⌘ \\"} onClick={onToggleSidebar}>Toggle sidebar</MenuItem>
          </MenuList></Menu>
        </HStack>
        <Text flex="1" minW={0} textAlign="center" fontSize="11px" color="var(--muted)" noOfLines={1} px={3} title={`${title} — Force Exam`}>{title} <Box as="span" color="var(--muted)">— Force Exam</Box></Text>
        <Tooltip label="Help and instructions (F1)"><IconButton aria-label="Help and instructions" size="xs" variant="ghost" icon={<QuestionOutlineIcon boxSize={4} />} color="var(--muted)" mr={2} onClick={onOpen} /></Tooltip>
      </Flex>
    </Box>
    <AppHelp isOpen={isOpen} onClose={onClose} />
  </>;
}
