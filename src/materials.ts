export type Tool = 'hss' | 'carbide';
export type Range = readonly [number, number];
export const NOTICE = 'Typical starting points, not guarantees. Verify tooling recommendations, workholding, rigidity and coolant before cutting.';
// Diameter bands in mm: <=3, <=6, <=12, >12. Vc in m/min; fz in mm/tooth.
export const diameterBands = [3, 6, 12, Infinity] as const;
export const materials = [
  { id: 'al6061', name: 'Aluminum 6061', aliases: ['6061', 'aluminum'], vc: { hss: [60, 120], carbide: [200, 400] }, fz: [[0.01, 0.03], [0.02, 0.06], [0.04, 0.10], [0.06, 0.15]] },
  { id: 'mild-steel', name: 'Mild steel Q235/1018', aliases: ['q235', '1018', 'steel'], vc: { hss: [20, 30], carbide: [80, 150] }, fz: [[0.005, 0.02], [0.015, 0.04], [0.025, 0.07], [0.04, 0.10]] },
  { id: 'ss304', name: 'Stainless steel 304', aliases: ['304', 'stainless'], vc: { hss: [10, 20], carbide: [50, 100] }, fz: [[0.005, 0.015], [0.01, 0.03], [0.02, 0.05], [0.03, 0.08]] },
  { id: 'steel45', name: '45# steel (normalized)', aliases: ['45', '45#', '1045'], vc: { hss: [15, 25], carbide: [60, 120] }, fz: [[0.005, 0.02], [0.01, 0.035], [0.025, 0.06], [0.04, 0.09]] },
  { id: 'brass', name: 'Brass', aliases: [], vc: { hss: [50, 100], carbide: [150, 300] }, fz: [[0.01, 0.03], [0.02, 0.05], [0.03, 0.08], [0.05, 0.12]] },
  { id: 'pom', name: 'POM (acetal)', aliases: ['acetal'], vc: { hss: [100, 200], carbide: [200, 400] }, fz: [[0.02, 0.05], [0.03, 0.08], [0.05, 0.12], [0.08, 0.20]] }
] as const;
export function getMaterial(id: string) {
  const key = id.toLowerCase();
  const found = materials.find(m => m.id === key || (m.aliases as readonly string[]).includes(key));
  if (!found) throw new Error(`Unknown material: ${id}. Run cnc-fs materials.`);
  return found;
}
export function startingPoints(id: string, tool: Tool, diameterMm: number) {
  if (tool !== 'hss' && tool !== 'carbide') throw new Error('Tool must be hss or carbide');
  if (!Number.isFinite(diameterMm) || diameterMm <= 0) throw new Error('Diameter must be positive and finite');
  const material = getMaterial(id);
  const band = diameterBands.findIndex(limit => diameterMm <= limit);
  const vcRange = material.vc[tool];
  const fzRange = material.fz[band];
  return { material, vcRange, fzRange, vc: (vcRange[0] + vcRange[1]) / 2, fz: (fzRange[0] + fzRange[1]) / 2 };
}
