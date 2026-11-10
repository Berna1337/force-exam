import { useEffect, useRef } from 'react';
import { Portal } from '@chakra-ui/react';
import confetti from 'canvas-confetti';

// Keep the canvas outside animated cards so the celebration fills the window.
function ConfettiCanvas() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!canvas.current || motion.matches) return;
    const fire = confetti.create(canvas.current, { resize: true });
    const colors = ['#00a1e0', '#1b96ff', '#ff538a', '#ffbe2e', '#2ee6a6', '#a864ff', '#ff794f'];
    const defaults = { colors, ticks: 220, gravity: 1, decay: .93, scalar: 1.2, disableForReducedMotion: true };
    const burst = (delay: number, options: confetti.Options) => window.setTimeout(() => {
      void fire({ ...defaults, ...options });
    }, delay);
    const timers = [
      burst(0, { particleCount: 90, spread: 85, startVelocity: 52, origin: { x: .5, y: .65 } }),
      burst(160, { particleCount: 65, angle: 60, spread: 65, startVelocity: 60, origin: { x: .05, y: .75 } }),
      burst(160, { particleCount: 65, angle: 120, spread: 65, startVelocity: 60, origin: { x: .95, y: .75 } }),
      burst(450, { particleCount: 70, spread: 140, startVelocity: 40, scalar: .9, origin: { x: .5, y: .45 } }),
      burst(650, { particleCount: 25, shapes: ['star'], scalar: 1.5, spread: 110, startVelocity: 38, origin: { x: .5, y: .55 } }),
    ];
    const stop = () => { timers.forEach(window.clearTimeout); fire.reset(); };
    const onMotionChange = () => { if (motion.matches) stop(); };
    motion.addEventListener('change', onMotionChange);
    return () => { stop(); motion.removeEventListener('change', onMotionChange); };
  }, []);
  return <canvas ref={canvas} className="passing-confetti" aria-hidden="true" />;
}

export default function PassingConfetti() {
  // Mount the effect with the canvas, after Portal has attached its host.
  return <Portal appendToParentPortal={false}><ConfettiCanvas /></Portal>;
}
