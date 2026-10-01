import { describe, it, expect } from 'vitest';
import { CIRCUIT_FX } from '../../src/scripts/career-circuit';
import { PIPE_FX } from '../../src/scripts/campus-pipeline';
import { TM_FX } from '../../src/scripts/qd-timeline';

// One notch down from the approved prototypes (user decision 2026-10-01); key moments stay.
describe('effect levels', () => {
  it('evidence circuit: half the electrons, shorter tails, one arc per failed line, sparser sparks', () => {
    expect(CIRCUIT_FX).toEqual({ electrons: 6, unknownElectrons: 1, tail: 5, arcs: 1, sparkEvery: 800, sparkBurst: 4 });
  });
  it('cleaning pipeline: about forty per cent fewer sparks, fainter glows, stops when still', () => {
    expect(PIPE_FX).toEqual({ sparkMin: 2, sparkRange: 2, glow: 0.25, idleAfter: 2000 });
  });
  it('time machine: fainter halos, two packets per beam, one shock ring, half the sparks', () => {
    expect(TM_FX).toEqual({ halo: 0.35, haloRed: 0.45, heads: 0.5, packets: 2, rings: 1, sparks: 48, shockSparks: 24 });
  });
});
