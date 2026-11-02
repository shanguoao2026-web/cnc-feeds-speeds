export { materials, diameterBands, NOTICE, getMaterial, startingPoints } from './materials.ts';
import { startingPoints, NOTICE } from './materials.ts';
import type { Tool } from './materials.ts';
export type { Tool, Range } from './materials.ts';
export interface Options {
  material: string;
  tool: Tool;
  /** Tool diameter for milling, workpiece diameter for turning. */
  d: number;
  z?: number;
  vc?: number;
  fz?: number;
  /** Required for turning: mm/rev, or inches/rev with imperial. */
  feedPerRev?: number;
  maxRpm?: number;
  maxFeed?: number;
  imperial?: boolean;
}
function positive(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be positive and finite`);
  return value;
}
export function calculate(mode: 'mill' | 'turn', options: Options) {
  if (mode !== 'mill' && mode !== 'turn') throw new Error('Mode must be mill or turn');
  const o = options;
  const scale = o.imperial ? 25.4 : 1;
  const diameterMm = positive(o.d, 'Diameter') * scale;
  const defaults = startingPoints(o.material, o.tool, diameterMm);
  const vc = o.vc === undefined ? defaults.vc : positive(o.vc, 'Cutting speed') * (o.imperial ? 0.3048 : 1);
  if (o.maxRpm !== undefined) positive(o.maxRpm, 'Max RPM');
  if (o.maxFeed !== undefined) positive(o.maxFeed, 'Max feed');
  let advanceMm: number;
  let fz: number | undefined;
  if (mode === 'mill') {
    positive(o.z as number, 'Flute count');
    if (!Number.isInteger(o.z)) throw new Error('Flute count must be an integer');
    if (o.feedPerRev !== undefined) throw new Error('feedPerRev is only valid for turning');
    fz = o.fz === undefined ? defaults.fz : positive(o.fz, 'Chip load') * scale;
    advanceMm = fz * o.z!;
  } else {
    if (o.fz !== undefined || o.z !== undefined) throw new Error('fz and z are only valid for milling');
    advanceMm = positive(o.feedPerRev as number, 'Turning feed per revolution') * scale;
  }
  const requestedRpm = vc * 1000 / (Math.PI * diameterMm);
  const rpm = Math.min(requestedRpm, o.maxRpm ?? Infinity);
  const warnings: string[] = [];
  if (rpm < requestedRpm) warnings.push('RPM clamped to machine maximum; feed recomputed from clamped RPM.');
  const requestedFeed = rpm * advanceMm / scale;
  const feed = Math.min(requestedFeed, o.maxFeed ?? Infinity);
  if (feed < requestedFeed) warnings.push('Feed clamped to machine maximum; effective chip load/feed per revolution reduced.');
  return {
    mode, material: defaults.material.id, tool: o.tool, units: o.imperial ? 'imperial' : 'metric',
    diameter: o.d, vc: vc / (o.imperial ? 0.3048 : 1),
    ...(mode === 'mill' ? { z: o.z, fz: fz! / scale, effectiveFz: feed / rpm / o.z! } : {}),
    requestedRpm, rpm, actualVc: rpm * Math.PI * diameterMm / 1000 / (o.imperial ? 0.3048 : 1),
    feed, feedPerRev: feed / rpm,
    feedUnit: o.imperial ? 'in/min' : 'mm/min',
    feedPerRevUnit: o.imperial ? 'in/rev' : 'mm/rev',
    warnings, notice: NOTICE
  };
}
export const mill = (options: Options) => calculate('mill', options);
export const turn = (options: Options) => calculate('turn', options);
