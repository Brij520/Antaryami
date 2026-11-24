# Antaryami

## REA (Reverse Engineer Anything)

This checkout includes a reproducible install of
[REA](https://github.com/morluto/rea) — an MIT-licensed CLI + MCP server for
reverse engineering binaries, Electron/JavaScript apps, .NET assemblies,
Android APKs, firmware, and websites with cited Evidence.

```bash
scripts/install-rea.sh --setup   # Node.js + REA CLI + MCP server + agent skill
rea --version                    # 6.10.1
rea doctor                       # readiness report
```

Full details, verified results, and the remaining optional analysis providers
(Ghidra/IDA/jadx/Kuna) are documented in [docs/rea.md](docs/rea.md).
