#!/usr/bin/env bash
# Gera de novo images/screenshot-php.png, screenshot-ts.png e icon.png
# (renderiza com shiki e tira o print com o Chrome do Windows).
set -e
cd "$(dirname "$0")/.."
RAIZ=$(pwd)
TMP=/mnt/c/Users/gustt/AppData/Local/Temp/scriptorium-print
CHROME="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
mkdir -p "$TMP"
[ -d "$TMP/node_modules/shiki" ] || (cd "$TMP" && npm init -y >/dev/null && npm i shiki@3 >/dev/null)
cp tools/render.mjs tools/icon.html "$TMP/"
shot() { "$CHROME" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$(wslpath -w "$TMP")\\profile" "$@" >/dev/null 2>&1; }
for l in php ts; do
  (cd "$TMP" && node render.mjs "$RAIZ/themes/Scriptorium-color-theme.json" "$TMP/$l.html" $l)
  shot --force-device-scale-factor=2 --window-size=1280,800 --screenshot="$(wslpath -w "$RAIZ/images")\\screenshot-$l.png" "file:///$(wslpath -m "$TMP/$l.html")"
done
shot --default-background-color=00000000 --window-size=256,256 --screenshot="$(wslpath -w "$RAIZ/images")\\icon.png" "file:///$(wslpath -m "$TMP/icon.html")"
ls -la images
