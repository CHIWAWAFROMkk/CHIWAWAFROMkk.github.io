/* Adapted from React Bits — SpotlightCard (ts-default).
 * Source: https://github.com/DavidHDev/react-bits/tree/ca44b3f9ee180676a06d7de8ec6bea84cddff85b/src/ts-default/Components/SpotlightCard
 * Copyright (c) 2026 David Haz. MIT + Commons Clause; see LICENSE.md.
 * Changes: paper/night site tones; no card styling; disabled for coarse/reduced-motion;
 * a fixed gradient layer moves with transform rather than repainting the gradient each frame.
 */
import { useRef, type ReactNode, type MouseEvent } from 'react';
import { isCoarse, prefersMotion } from '../../scripts/motion/tokens';
import './SpotlightCard.css';
export interface SpotlightCardProps { children: ReactNode; className?: string; tone?: 'paper' | 'night' }
export default function SpotlightCard({ children, className = '', tone = 'paper' }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (event: MouseEvent<HTMLDivElement>) => {
    if (!ref.current || isCoarse() || !prefersMotion()) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mouse-x', `${event.clientX - r.left}px`);
    ref.current.style.setProperty('--mouse-y', `${event.clientY - r.top}px`);
  };
  return <div ref={ref} onMouseMove={move} className={`card-spotlight card-spotlight--${tone} ${className}`}>{children}<span className="card-spotlight__light" aria-hidden="true" /></div>;
}
