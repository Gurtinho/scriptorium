#!/usr/bin/env bash
# Empacota o tema e instala no VS Code do Windows (para testar antes de publicar).
set -e
cd "$(dirname "$0")"
npx --yes @vscode/vsce package -o scriptorium.vsix
cmd.exe /c "code --install-extension $(wslpath -w scriptorium.vsix) --force"
