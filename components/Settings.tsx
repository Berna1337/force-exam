import { Box, Button, FormControl, FormLabel, Heading, HStack, Input, Select, SimpleGrid, Stack, Switch, Text, useMediaQuery } from '@chakra-ui/react';
import { usePreferences, type Preferences } from '../contexts/Preferences';
const themes = [
  { id: 'graphite', name: 'Graphite', background: '#1e1e1e', surface: '#252525', accent: '#b69af6' },
  { id: 'midnight', name: 'Midnight', background: '#171d2b', surface: '#20293b', accent: '#90c5ff' },
  { id: 'warm', name: 'Warm charcoal', background: '#25211f', surface: '#302a27', accent: '#e9b47e' },
  { id: 'forest', name: 'Forest', background: '#18231e', surface: '#22312a', accent: '#7ddbc4' },
  { id: 'rose', name: 'Rose', background: '#261d25', surface: '#332832', accent: '#efa9cb' },
  { id: 'oled', name: 'OLED Black', background: '#000000', surface: '#000000', accent: '#ffffff' },
  { id: 'catppuccin', name: 'Catppuccin Mocha', background: '#1e1e2e', surface: '#313244', accent: '#cba6f7' },
  { id: 'one-dark', name: 'One Dark', background: '#282c34', surface: '#2c313a', accent: '#61afef' },
  { id: 'daylight', name: 'Daylight', background: '#f3f6fb', surface: '#ffffff', accent: '#2563eb' },
  { id: 'paper', name: 'Paper', background: '#f7f3eb', surface: '#fffdf8', accent: '#986139' },
  { id: 'latte', name: 'Catppuccin Latte', background: '#eff1f5', surface: '#ffffff', accent: '#8839ef' },
] as const;
export default function Settings({ onBackup }: { onBackup: () => void }) {
  const [systemReducedMotion] = useMediaQuery('(prefers-reduced-motion: reduce)', { ssr: true, fallback: false });
  const { preferences, update, reset, error } = usePreferences();
  return <Stack spacing={7} maxW="760px" mx="auto" aria-label="App settings">
    <Box><Text fontSize="10px" letterSpacing=".12em" color="var(--accent-text)">MAKE IT YOURS</Text><Heading mt={3} size="lg" fontWeight="500">Settings</Heading><Text mt={3} color="var(--muted)" fontSize="sm">A workspace that feels right for you. Changes save on this device.</Text></Box>
    {error && <Text role="alert" color="var(--danger)">{error}</Text>}
    <Box p={{ base: 4, md: 6 }} bg="var(--surface)" border="1px solid var(--border)" borderRadius="xl">
      <Heading size="sm" mb={5}>Appearance</Heading>
      <Text fontSize="sm" color="var(--muted)" mb={4}>Start with a built-in theme, then choose your own accent. Colors apply immediately.</Text>
      <SimpleGrid columns={{ base: 2, sm: 3 }} gap={3} mb={6} aria-label="Built-in themes">
        {themes.map(theme => <Button key={theme.id} h="auto" p={3} display="block" textAlign="left" variant="unstyled" border="1px solid" borderColor={preferences.theme === theme.id ? 'var(--accent)' : 'var(--border)'} aria-pressed={preferences.theme === theme.id} aria-label={`Apply ${theme.name} theme`} onClick={() => update({ theme: theme.id, accent: 'custom', customAccent: theme.accent })}>
          <HStack bg={theme.background} borderRadius="md" p={3} spacing={2} mb={3} aria-hidden="true"><Box w={3} h={9} bg={theme.accent} borderRadius="sm" /><Box flex={1} bg={theme.surface} p={2} borderRadius="sm"><Box h={1} w="70%" bg={theme.accent} borderRadius="full" /><Box mt={2} h={1} bg="#ffffff30" borderRadius="full" /></Box></HStack>
          <Text fontSize="xs">{theme.name}</Text>
        </Button>)}
      </SimpleGrid>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={5}>
        <FormControl><FormLabel fontSize="sm" htmlFor="workspace-theme">Workspace theme</FormLabel><Select id="workspace-theme" value={preferences.theme} onChange={e => { const theme = themes.find(theme => theme.id === e.target.value); if (theme) update({ theme: theme.id, accent: 'custom', customAccent: theme.accent }); }}>{themes.map(theme => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</Select></FormControl>
        <FormControl><FormLabel fontSize="sm" htmlFor="accent-color">Accent color</FormLabel><Select id="accent-color" value={preferences.accent} onChange={e => update({ accent: e.target.value as Preferences['accent'] })}><option value="violet">Violet</option><option value="teal">Teal</option><option value="blue">Blue</option><option value="custom">Custom</option></Select></FormControl>
        <FormControl><FormLabel fontSize="sm" htmlFor="custom-accent">Custom accent</FormLabel><HStack><Input id="custom-accent" aria-label="Custom accent color" type="color" value={preferences.customAccent} onChange={e => update({ accent: 'custom', customAccent: e.target.value })} w="64px" p={1} cursor="pointer" /><Text fontFamily="mono" fontSize="sm">{preferences.customAccent.toUpperCase()}</Text></HStack><Text mt={2} fontSize="xs" color="var(--muted)">Personalize buttons, selections, and highlights.</Text></FormControl>
        <FormControl><FormLabel fontSize="sm" htmlFor="text-size">Text size</FormLabel><Select id="text-size" value={preferences.textSize} onChange={e => update({ textSize: e.target.value as Preferences['textSize'] })}><option value="standard">Standard</option><option value="large">Larger</option></Select><Text mt={2} fontSize="xs" color="var(--muted)">Enlarges reading text and controls throughout the app.</Text></FormControl>
      </SimpleGrid>
      <FormControl display="flex" alignItems="center" justifyContent="space-between" gap={4} mt={6}><Box><FormLabel htmlFor="reduce-motion" mb={1} fontSize="sm">Reduce motion</FormLabel><Text fontSize="xs" color="var(--muted)">Skip decorative animations. Your system preference is always respected.</Text></Box><Switch id="reduce-motion" colorScheme="purple" isChecked={preferences.reducedMotion} onChange={e => update({ reducedMotion: e.target.checked })} /></FormControl>
      {systemReducedMotion && <Text mt={3} fontSize="xs" color="var(--warning)">Your system currently requests reduced motion. Confetti is disabled even when the switch above is off. Enable animation effects in your system accessibility settings to allow celebrations.</Text>}
      <HStack mt={6} justify="space-between" flexWrap="wrap" gap={3}><HStack spacing={2} aria-hidden="true">{['var(--app-bg)', 'var(--surface)', 'var(--accent)'].map(color => <Box key={color} bg={color} w={7} h={7} border="1px solid var(--border)" borderRadius="full" />)}<Text fontSize="xs" color="var(--muted)">Live preview</Text></HStack><Button variant="ghost" size="sm" onClick={reset}>Reset appearance</Button></HStack>
    </Box>
    <Box p={{ base: 4, md: 6 }} bg="var(--surface)" border="1px solid var(--border)" borderRadius="xl"><Heading size="sm">Your data</Heading><Text mt={3} color="var(--muted)" fontSize="sm" lineHeight="1.8">Back up exams, images, scores, saved sessions, folders, versions, drafts, and appearance settings. Restore a backup to continue on another device.</Text><Button mt={4} size="sm" variant="outline" onClick={onBackup}>Backup and restore</Button><Text mt={3} fontSize="xs" color="var(--muted)">Everything stays on this device. Use exam or collection exports to share study material.</Text></Box>
  </Stack>;
}
