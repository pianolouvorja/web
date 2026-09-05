#!/usr/bin/env bash
# WT-5K: abre o receiver/popup em kiosk REAL (fullscreen sem chrome) em
# qualquer SO — Linux (X11), macOS, Windows (Git Bash/WSL com chrome.exe).
#
# Uso:
#   ./scripts/open-projector-kiosk.sh 'https://host/palco/?code=ABC123' [X Y]
#   ./scripts/open-projector-kiosk.sh 'http://localhost:5173/popup?slot=1&module=bible' 1920 0
#
# O 2º/3º args são a posição da janela (canto sup. esq. do monitor alvo)
# para escolher em qual tela abrir. Omita para deixar o SO decidir.
set -euo pipefail

URL="${1:?uso: open-projector-kiosk.sh <url> [posX posY]}"
POS_X="${2:-}"
POS_Y="${3:-}"

# Perfil isolado e PERSISTENTE: chrome reutiliza o processo existente e
# ignora --kiosk se usar o perfil padrão (pitfall conhecido).
DATA_DIR="${LOUVORJA_KIOSK_PROFILE:-$HOME/.config/LouvorJA-Palco-Kiosk}"

FLAGS=(--user-data-dir="$DATA_DIR" --no-first-run --no-default-browser-check
  --kiosk --new-window --disable-features=Translate)

if [[ -n "$POS_X" && -n "$POS_Y" ]]; then
  FLAGS+=(--window-position="$POS_X,$POS_Y")
fi

find_chrome() {
  for c in google-chrome google-chrome-stable chromium chromium-browser \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/c/Program Files/Google/Chrome/Application/chrome.exe" \
    "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"; do
    if command -v "$c" &>/dev/null || [[ -x "$c" ]]; then
      echo "$c"
      return
    fi
  done
  echo "chrome/chromium não encontrado" >&2
  exit 1
}

exec "$(find_chrome)" "${FLAGS[@]}" "$URL"
