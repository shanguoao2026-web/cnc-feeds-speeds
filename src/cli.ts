import { pathToFileURL } from 'node:url';
import { calculate, materials, NOTICE, diameterBands } from './index.ts';
import type { Options } from './index.ts';
const help = `cnc-fs mill --material al6061 --tool carbide --d 10 --z 3
cnc-fs turn --material mild-steel --tool carbide --d 40 --feed-per-rev 0.2
cnc-fs materials [--imperial] [--json]
Options: --vc NUMBER, --fz NUMBER (mill), --feed-per-rev NUMBER (turn),
         --max-rpm NUMBER, --max-feed NUMBER, --imperial, --json, --help
Metric: diameter mm, Vc m/min, fz mm/tooth, feed mm/min.
Imperial: diameter inches, Vc SFM, fz IPT, feed inches/min.
Defaults use midpoint of typical material ranges. Turning requires feed per rev.`;
function main(args: string[]) {
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') { console.log(help); return; }
  const command = args.shift();
  if (!['mill', 'turn', 'materials'].includes(command!)) throw new Error(`Unknown command: ${command}`);
  const flags: Record<string, string | boolean> = {};
  const booleans = ['imperial', 'json', 'help'];
  const values = ['material', 'tool', 'd', 'z', 'vc', 'fz', 'feed-per-rev', 'max-rpm', 'max-feed'];
  while (args.length) {
    const token = args.shift()!;
    const key = token.slice(2);
    if (!token.startsWith('--') || ![...booleans, ...values].includes(key)) throw new Error(`Unknown option: ${token}`);
    if (key in flags) throw new Error(`Duplicate option: ${token}`);
    if (booleans.includes(key)) flags[key] = true;
    else {
      const value = args.shift();
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${token}`);
      flags[key] = value;
    }
  }
  if (flags.help) { console.log(help); return; }
  const imperial = !!flags.imperial;
  if (command === 'materials') {
    if (Object.keys(flags).some(k => values.includes(k))) throw new Error('materials accepts only --json and --imperial');
    const rows = materials.map(m => ({ id: m.id, name: m.name,
      vc: Object.fromEntries(Object.entries(m.vc).map(([tool, range]) => [tool, range.map(v => v / (imperial ? 0.3048 : 1))])),
      fz: m.fz.map((range, i) => ({ diameterMax: Number.isFinite(diameterBands[i]) ? diameterBands[i] / (imperial ? 25.4 : 1) : null, range: range.map(v => v / (imperial ? 25.4 : 1)) })) }));
    const units = { vc: imperial ? 'SFM' : 'm/min', diameter: imperial ? 'in' : 'mm', fz: imperial ? 'IPT' : 'mm/tooth' };
    if (flags.json) console.log(JSON.stringify({ materials: rows, units, notice: NOTICE }, null, 2));
    else {
      console.log(NOTICE);
      console.table(rows.map(m => ({ ID: m.id, Material: m.name, [`HSS (${units.vc})`]: m.vc.hss.join('–'), [`Carbide (${units.vc})`]: m.vc.carbide.join('–') })));
      for (const m of rows) { console.log(`${m.id}: fz (${units.fz}); diameter (${units.diameter})`); console.table(m.fz.map(b => ({ 'Diameter <=': b.diameterMax ?? 'unbounded', Minimum: b.range[0], Maximum: b.range[1] }))); }
    }
    return;
  }
  for (const key of ['material', 'tool', 'd', ...(command === 'mill' ? ['z'] : ['feed-per-rev'])]) if (flags[key] === undefined) throw new Error(`Missing --${key}`);
  const options: Record<string, unknown> = { material: flags.material, tool: flags.tool, imperial };
  const mapping = { d: 'd', z: 'z', vc: 'vc', fz: 'fz', 'feed-per-rev': 'feedPerRev', 'max-rpm': 'maxRpm', 'max-feed': 'maxFeed' };
  for (const [flag, key] of Object.entries(mapping)) if (flags[flag] !== undefined) options[key] = Number(flags[flag]);
  const result = calculate(command as 'mill' | 'turn', options as unknown as Options);
  if (flags.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(NOTICE);
    console.table({ Material: result.material, 'Spindle RPM': result.rpm.toFixed(2), [`Feed (${result.feedUnit})`]: result.feed.toFixed(4), [`Feed/rev (${result.feedPerRevUnit})`]: result.feedPerRev.toFixed(5), [`Actual Vc (${imperial ? 'SFM' : 'm/min'})`]: result.actualVc.toFixed(2) });
    for (const warning of result.warnings) console.error(`Warning: ${warning}`);
  }
}
export function runCli(args: string[]) {
  try { main([...args]); } catch (error) { console.error(`Error: ${(error as Error).message}`); process.exitCode = 1; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) runCli(process.argv.slice(2));
