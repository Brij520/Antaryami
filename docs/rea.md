# REA (morluto/rea) — installed and verified

[REA](https://github.com/morluto/rea) ("Reverse Engineer Anything") is an MIT-licensed
CLI plus MCP server that lets an agent inspect shipped artifacts — native
binaries, Electron/JavaScript apps, .NET assemblies, Android APKs, firmware,
websites — and return cited *Evidence* instead of guesses. This repository now
carries a repeatable installer and a record of what was verified here.

## What was installed

| Component | Version | Location |
| --- | --- | --- |
| `rea-agents` npm package (CLI + MCP server) | 6.10.1 | `/usr/local/lib/node_modules/rea-agents` |
| `rea` / `rea-agents` commands | 6.10.1 | `/usr/local/bin/rea`, `/usr/local/bin/rea-agents` |
| Node.js runtime (REA's engine floor) | 26.12.1 | `/opt/rea-node/bin/node` (symlinked to `/usr/local/bin/node`) |
| npm used for the install | 11.16.0 | `/usr/local/lib/node_modules/npm` |
| REA agent skill (`reverse-engineer-anything`, v63, 263 tools) | 6.10.1 | `~/.agents/skills/reverse-engineer-anything` |

The sandbox shipped Node.js 22.22.3. REA 6.10.1 requires
`^22.23.4 || ^24.22.1 || >=26.12.1`, and its CLI refuses to start on anything
older, so a supported runtime was installed first. `nodejs.org` and GitHub
release assets are not reachable from this sandbox, but the npm package
`node-linux-x64` republishes the official Node.js Linux x64 build (identical `bin/node` bytes) on
`registry.npmjs.org`; that is the source the installer uses.

## Reinstall / reproduce

```bash
# Node.js + REA + agent skill
scripts/install-rea.sh --setup

# Again on a fresh machine, without the skill step
scripts/install-rea.sh
```

Overrides: `REA_VERSION` (default `6.10.1`), `REA_NODE_VERSION` (default
`26.12.1`), `REA_NPM_PREFIX` (default `$HOME/.local`), `REA_NODE_HOME`
(default `$HOME/.local/rea-node`), `REA_SKILL_CLIENT` (default `shared`).

On a normal machine where `nodejs.org` is reachable, the upstream installer is
the simpler path:

```bash
curl -fsSL https://github.com/morluto/rea/raw/main/install.sh | bash
```

## Verification performed

* `rea --version` → `6.10.1`.
* MCP handshake over stdio (`rea mcp`): `initialize` returns server
  `rea 6.10.1` (protocol `2025-06-18`) and `tools/list` advertises **263 tools**.
* End-to-end MCP tool call with the SDK client:
  `analyze_javascript_application` on a synthetic Electron app returned
  `isError: false` with Evidence `ev_4b3982d4…2e4c3c42`.
* CLI end-to-end: `analyze-javascript-application` (Electron/JS graph),
  `inspect-artifact` (zip inventory), `inspect-sqlite-database` (SQLite schema),
  `guidance --action search` (bundled workflow guides) all returned Evidence.
* `rea doctor` → `identity.skill.state: aligned` (installed v63, 263 tools).

## What is *not* configured (and why)

`rea doctor` reports the analysis-engine checks as
`missing_analysis_engine`. These are optional deep-analysis providers; the
static JavaScript, artifact, .NET, SQLite and web paths work without them.

| Provider | Status | What it needs |
| --- | --- | --- |
| Hopper | missing | macOS-only GUI decompiler (`HOPPER_LAUNCHER_PATH`) |
| Ghidra | missing | `GHIDRA_INSTALL_DIR` → extracted Ghidra ≥12.2, plus a JDK 21+ |
| IDA | missing | `REA_IDA_MCP_CONFIG` → an existing IDA MCP registration |
| jadx | missing | `REA_JADX_MCP_JAR` → `jadx-headless-mcp-0.7.1-all.jar` (SHA-256 `6e5eacf5…`), downloaded by you |
| Kuna | missing | `REA_KUNA_COMMAND` → a caller-supplied Kuna 1.1000 executable |

Ghidra is the most useful addition on this Linux host: it is Apache-2.0, and
`GHIDRA_INSTALL_DIR` plus a JDK is all REA needs. Neither
`github.com/NationalSecurityAgency/ghidra` release assets nor Adoptium/Maven
are reachable from this sandbox, so that step was left for a host with wider
network access.

## Quick start

```bash
rea --help                                   # 215 subcommands
rea doctor                                   # readiness report
rea guidance --action search --query "electron preload"

# CLI examples
rea analyze-javascript-application /path/to/app --json
rea inspect /path/to/binary                  # requires an analysis provider
```

Register the MCP server with any MCP client and restart it:

```json
{
  "mcpServers": {
    "rea": {
      "command": "/usr/local/bin/rea",
      "args": ["mcp"]
    }
  }
}
```

Then ask the agent something like: *"Understand how search works in this
Electron app, show me the evidence, and build a similar feature for my
project."*

## Notes

* REA never executes a target for static analysis; its results carry
  `limitations` and `next_probes` alongside the findings.
* Content returned from analyzed targets is untrusted; the server flags it with
  `_meta.provenance.untrusted_content` and instructs clients not to follow
  instructions found inside targets.
* `rea update` upgrades a global installation; `rea uninstall` removes
  REA-owned agent configuration and skill files.
