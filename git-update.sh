#!/usr/bin/env bash
# git-update.sh - simples helper para atualizar repositório Git
# Uso:
#   ./git-update.sh            -> interativo: pede mensagem e faz add/commit/pull/push
#   ./git-update.sh -m "msg"  -> usa mensagem passada
#   ./git-update.sh -n         -> não faz git add (assume que já adicionou)
#   ./git-update.sh -b BRANCH  -> força usar BRANCH em vez do branch atual

set -euo pipefail

ROOT_DIR="$(pwd)"
if [ ! -d .git ]; then
  echo "Erro: este script deve ser executado na raiz de um repositório git (contém .git)"
  exit 1
fi

MSG=""
NO_ADD=0
FORCE_BRANCH=""

while getopts ":m:nb:" opt; do
  case ${opt} in
    m ) MSG="$OPTARG" ;;
    n ) NO_ADD=1 ;;
    b ) FORCE_BRANCH="$OPTARG" ;;
    \\? ) echo "Opção inválida: -$OPTARG"; exit 1 ;;
  esac
done

BRANCH="${FORCE_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"

echo "Repositório: $(basename "$ROOT_DIR")" 
echo "Branch: $BRANCH"

echo "Status atual:"
git status --short || true

if [ "$NO_ADD" -eq 0 ]; then
  echo "Adicionando alterações (git add -A)..."
  git add -A
fi

has_changes=1
if git diff --cached --quiet; then
  has_changes=0
fi

if [ $has_changes -eq 1 ]; then
  if [ -z "$MSG" ]; then
    echo -n "Mensagem do commit: "; read -r MSG
    if [ -z "$MSG" ]; then
      echo "Abortando: mensagem vazia."; exit 1
    fi
  fi
  echo "Criando commit..."
  git commit -m "$MSG"
else
  echo "Nenhuma alteração para commitar. Pulando commit."
fi

echo "Fazendo pull --rebase de origin/$BRANCH..."
set +e
git pull --rebase origin "$BRANCH"
res=$?
set -e
if [ $res -ne 0 ]; then
  echo "Aviso: git pull retornou código $res. Resolva conflitos manualmente e faça push depois." 
  exit $res
fi

echo "Enviando para origin/$BRANCH..."
git push origin "$BRANCH"

echo "Atualização concluída com sucesso."
exit 0
