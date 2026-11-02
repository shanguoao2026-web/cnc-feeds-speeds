Build a small, dependency-free TypeScript/Node (Node 22+, use node:test, tsx or plain tsc ok) CLI + library "cnc-feeds-speeds".
Features:
- Compute spindle RPM = (Vc*1000)/(pi*D) and feed F = RPM * z * fz for milling; turning: RPM from Vc and D, feed mm/rev.
- Built-in materials table (aluminum 6061, mild steel Q235/1018, stainless 304, 45# steel, brass, POM) with typical Vc ranges for HSS and carbide, and fz per tooth by tool diameter band. Clearly mark values as typical starting points, not guarantees.
- Clamp to machine max RPM / max feed given via flags; when RPM clamped, recompute feed and print a warning.
- Metric default, --imperial option (SFM, IPT, inches).
- Output human table and --json.
- CLI: `cnc-fs mill --material al6061 --tool carbide --d 10 --z 3 [--max-rpm 12000]`, `cnc-fs turn ...`, `cnc-fs materials`.
- README in English (with a short Chinese section), MIT LICENSE, .gitignore (node_modules, dist, *.log), at least 15 tests, `npm test` passes.
No network calls, no secrets.
