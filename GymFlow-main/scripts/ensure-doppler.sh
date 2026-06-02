#!/bin/bash
if command -v doppler &> /dev/null; then
  exit 0
fi

echo "Doppler CLI nao encontrado. Instalando..."

if curl -Ls https://cli.doppler.com/install.sh | sudo sh; then
  echo "Doppler instalado com sucesso!"
else
  echo "Falha ao instalar Doppler. Tente: curl -Ls https://cli.doppler.com/install.sh | sudo sh"
  exit 1
fi
