# cnc-feeds-speeds

A dependency-free TypeScript library and Node CLI for milling and turning feeds and speeds. All material values are **typical starting points, not guarantees**. Verify tool manufacturer guidance, material condition, machine rigidity, workholding, engagement and coolant before cutting. The table is a general reference, not a tool-specific cutting model.

Requires Node 22.6+ (Node's built-in TypeScript stripping). Earlier Node 22 releases require the experimental flag; the CLI and test scripts supply it automatically. No network calls or secrets are used by the calculator.

```sh
npm install
npm test
npm start -- mill --material al6061 --tool carbide --d 10 --z 3
node bin/cnc-fs.js turn --material mild-steel --tool carbide --d 40 --feed-per-rev 0.2
```

Install the local CLI with `npm link`, then use:

```sh
cnc-fs mill --material al6061 --tool carbide --d 10 --z 3 --max-rpm 12000
cnc-fs mill --material al6061 --tool carbide --d 0.375 --z 3 --vc 800 --fz 0.002 --imperial --json
cnc-fs turn --material ss304 --tool carbide --d 50 --vc 70 --feed-per-rev 0.15 --max-feed 250
cnc-fs materials
cnc-fs materials --json
cnc-fs --help
```

Metric is the default: diameter in mm, cutting speed `--vc` in m/min, milling chip load `--fz` in mm/tooth, turning `--feed-per-rev` in mm/rev, and `--max-feed` in mm/min. With `--imperial`, these become inches, SFM, IPT, inches/rev and inches/min. RPM and flute count `--z` are unit independent. Milling diameter is tool diameter; turning diameter is workpiece diameter.

Both modes require `--material`, `--tool hss|carbide`, and `--d`. Milling requires a positive integer `--z`. Turning requires explicit `--feed-per-rev`; milling chip loads are not used to infer turning feed. Numeric options must be positive and finite. Unknown, duplicate and inappropriate mode options fail with exit code 1.

The default Vc is the midpoint of the selected material/tool range. Milling fz defaults to the midpoint for diameter bands ≤3, ≤6, ≤12 and >12 mm. Explicit `--vc` and `--fz` override these defaults in the selected units. `cnc-fs materials` displays all ranges and bands; `--imperial` converts the table too. Materials: `al6061`, `mild-steel` (aliases `q235`, `1018`), `ss304` (`304`), `steel45` (`45#`, normalized 1045), `brass`, and `pom` (`acetal`). Material identifiers are case insensitive.

Calculations use full precision:

- RPM = Vc × 1000 / (π × diameter), with metric inputs internally.
- Milling feed/min = RPM × flute count × fz.
- Turning feed/min = RPM × feed/rev.

`--max-rpm` clamps RPM first and recomputes feed. `--max-feed` then caps feed without changing RPM, reducing the effective chip load or feed/rev. Each applied limit produces a warning. Human output rounds only for display. `--json` returns full precision results, warnings, units and the starting-point notice; JSON warnings are included in the object. `requestedRpm` is before RPM clamping; `actualVc`, `effectiveFz` (milling), and `feedPerRev` describe the final operating point.

## Library

Run TypeScript consumers with `node --experimental-strip-types` or a TypeScript-aware runtime. The package exports TypeScript source, with no build step or runtime dependencies.

```ts
import { mill, turn, materials, startingPoints } from 'cnc-feeds-speeds';

const result = mill({
  material: 'al6061', tool: 'carbide', d: 10, z: 3,
  maxRpm: 12000, maxFeed: 2000
});
console.log(result.rpm, result.feed, result.warnings);
const turning = turn({
  material: 'brass', tool: 'hss', d: 40, feedPerRev: 0.2
});
```

The library also exports `calculate`, `getMaterial`, `diameterBands`, `NOTICE`, and TypeScript types `Options`, `Tool`, and `Range`. Invalid inputs throw an Error. `startingPoints(material, tool, diameterMm)` always takes metric diameter and returns metric ranges and midpoints, regardless of calculator output units. The material table applies the same general fz ranges to HSS and carbide; select conservative chip loads for your particular tool and setup.

## 中文说明

本工具用于估算铣削和车削的转速及进给量。默认公制，`--imperial` 使用英制。材料表仅为典型起始参考，不保证加工安全或效果；请根据刀具厂商建议、机床刚性、装夹和冷却条件调整。铣削需指定刃数 `--z`，车削需指定每转进给 `--feed-per-rev`。限制转速后会重新计算进给，`--json` 可输出结构化结果。

## License

MIT. See LICENSE.
