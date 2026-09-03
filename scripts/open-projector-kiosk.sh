#!/usr/bin/env bash
# Abre UMA tela de projeção sem chrome (URL/menu/título) em perfil isolado.
# Uso: ./scripts/open-projector-kiosk.sh 'http://HOST:5173/popup?slot=1&role=screen&module=bible'
set -euo pipefail

url="${1:?Informe a URL completa da tela de projeção.}"
profile_dir="${XDG_CONFIG_HOME:-$HOME/.config}/LouvorJA-Palco-Kiosk"

for browser in google-chrome google-chrome-stable chromium chromium-browser; do
  if command -v "$browser" >/dev/null 2>&1; then
    exec "$browser" \
      --user-data-dir="$profile_dir" \
      --no-first-run \
      --no-default-browser-check \
      --kiosk \
      --new-window \
      "$url"
  fi
done

printf 'Chrome/Chromium não encontrado. Instale Google Chrome ou Chromium.\n' >&2
exit 127
