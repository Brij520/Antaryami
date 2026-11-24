#!/usr/bin/env bash
# Install REA (morluto/rea) and a Node.js runtime it accepts.
#
# REA requires Node.js 22.x (>=22.23.4), 24.x (>=24.22.1) or >=26.12.1.
# The official installer (https://github.com/morluto/rea/blob/main/install.sh)
# only downloads the npm package, so this script adds the one thing that
# sandboxes usually lack: a matching Node.js. When nodejs.org is reachable,
# prefer the official installer instead:
#
#   curl -fsSL https://github.com/morluto/rea/raw/main/install.sh | bash
#
# Usage:
#   scripts/install-rea.sh                     # install or verify only
#   scripts/install-rea.sh --setup             # also run `rea setup` to install the agent skill
#   scripts/install-rea.sh --setup --skill-client claude_code
#
# Overridable with environment variables:
#   REA_VERSION (6.10.1), REA_NODE_VERSION (26.12.1),
#   REA_NPM_PREFIX ($HOME/.local), REA_NODE_HOME ($HOME/.local/rea-node),
#   REA_SKILL_CLIENT (shared)
set -euo pipefail

REA_VERSION="${REA_VERSION:-6.10.1}"
NODE_VERSION="${REA_NODE_VERSION:-26.12.1}"
NPM_PREFIX="${REA_NPM_PREFIX:-$HOME/.local}"
NODE_HOME="${REA_NODE_HOME:-$HOME/.local/rea-node}"
SKILL_CLIENT="${REA_SKILL_CLIENT:-shared}"

run_setup=false
while (($# > 0)); do
  case "$1" in
    --setup) run_setup=true; shift ;;
    --skill-client)
      (($# >= 2)) || { echo "error: --skill-client needs a value" >&2; exit 2; }
      SKILL_CLIENT="$2"; shift 2 ;;
    -h|--help) sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "error: unknown option: $1" >&2; exit 2 ;;
  esac
done

log() { printf '==> %s\n' "$*"; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

command -v npm >/dev/null 2>&1 || die "npm is required. Install Node.js from https://nodejs.org first."
command -v curl >/dev/null 2>&1 || die "curl is required."

# Mirrors package.json#engines.node from rea-agents: ^22.23.4 || ^24.22.1 || >=26.12.1
node_is_supported() {
  local version major minor patch
  version="$(node -p 'process.versions.node' 2>/dev/null || true)"
  [ -n "$version" ] || return 1
  IFS=. read -r major minor patch <<<"${version%%+*}"
  [[ "$major" =~ ^[0-9]+$ && "$minor" =~ ^[0-9]+$ && "$patch" =~ ^[0-9]+$ ]] || return 1
  ((major == 22 && (minor > 23 || (minor == 23 && patch >= 4)))) ||
    ((major == 24 && (minor > 22 || (minor == 22 && patch >= 1)))) ||
    ((major == 26 && (minor > 12 || (minor == 12 && patch >= 1)))) ||
    ((major > 26))
}

install_node() {
  local tmp
  log "Node.js $(node -v 2>/dev/null || echo 'not found') is unsupported; installing ${NODE_VERSION} from the npm registry"
  command -v tar >/dev/null 2>&1 || die "tar is required to unpack the Node.js runtime."
  tmp="$(mktemp -d "${TMPDIR:-/tmp}/rea-node.XXXXXX")"
  # nodejs.org and GitHub release assets are not always reachable from sandboxes;
  # node-linux-x64 republishes the official Node.js tarball on npm.
  npm pack "node-linux-x64@${NODE_VERSION}" --pack-destination "$tmp" >/dev/null
  mkdir -p "$NODE_HOME"
  tar xzf "$tmp"/node-linux-x64-*.tgz -C "$NODE_HOME" --strip-components=1 --exclude=package/share --exclude=package/include
  rm -rf "$tmp"
  export PATH="$NODE_HOME/bin:$PATH"
  node_is_supported || die "installed Node.js $(node -v) still does not satisfy REA's engine range."
  log "Node.js $(node -v) ready at $NODE_HOME"
}

install_rea() {
  local prefix_bin
  prefix_bin="$NPM_PREFIX/bin/rea"
  if [ -x "$prefix_bin" ] && [ "$("$prefix_bin" --version 2>/dev/null)" = "$REA_VERSION" ]; then
    log "REA ${REA_VERSION} already installed at $prefix_bin"
  else
    log "Installing rea-agents@${REA_VERSION} into ${NPM_PREFIX}"
    npm install --global --prefix "$NPM_PREFIX" --engine-strict=false "rea-agents@${REA_VERSION}"
  fi
  [ -x "$prefix_bin" ] || die "npm finished without creating $prefix_bin"
  log "REA $("$prefix_bin" --version) ready at $prefix_bin"
  case ":$PATH:" in
    *":$NPM_PREFIX/bin:"*) ;;
    *) log "Add $NPM_PREFIX/bin to PATH to call 'rea' directly." ;;
  esac
}

if node_is_supported; then
  log "Node.js $(node -v) already satisfies REA's engine range"
else
  install_node
fi

install_rea

if [ "$run_setup" = true ]; then
  log "Running rea setup --yes --skill-client ${SKILL_CLIENT}"
  "$NPM_PREFIX/bin/rea" setup --yes --skill-client "$SKILL_CLIENT"
else
  log "Skipped agent setup. Run: rea setup --skill-client ${SKILL_CLIENT}"
fi

log "Check readiness with: rea doctor"
