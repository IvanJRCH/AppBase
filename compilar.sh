#!/bin/bash
set -e

echo "==> [1/5] Instalando dependencias del backend (raíz)"
bun install
bun detectar-addons.js
# ADDON_ASSETS se genera solo con los .node encontrados en node_modules
source ./addons-assets.sh

echo "==> [2/5] Instalando dependencias de la GUI"
cd gui
npm install
npm run build
cd ..

echo "==> [3/5] Compilando ejecutable para Linux (ELF)"
# Nota: ELF de Linux no lleva ícono de ventana; ese es comportamiento normal.
bun build --compile \
  --asset ./gui/build \
  "${ADDON_ASSETS[@]}" \
  --aot --minify --sourcemap --obfuscate --bytecode \
  ./main.js --outfile app

echo "==> [4/5] Compilando ejecutable para Windows (cross-compile desde Linux)"
# Se buscan/ descargan los .node de Windows y se generan solo esos assets.
bun detectar-addons.js --windows --only-win32
source ./addons-assets.sh
bun build --compile \
  --asset ./gui/build \
  "${ADDON_ASSETS[@]}" \
  --aot --minify --sourcemap --obfuscate --bytecode \
  --target=bun-windows-x64 \
  ./main.js --outfile app.exe

echo "==> [5/5] Agregando ícono y metadatos al .exe de Windows"
# titulo, publicador y resto de metadatos se leen de binary.json
bun agregar-icono.js app.exe app.ico

# Dejar los archivos generados como los espera el desarrollo local.
bun detectar-addons.js

echo ""
echo "==> Listo. Ejecutables:"
echo "   Linux : ./app"
echo "   Windows: app.exe"
echo ""
echo "Para desarrollar sin compilar:  bun dev   (y en otra terminal: cd gui && npm run dev)"
