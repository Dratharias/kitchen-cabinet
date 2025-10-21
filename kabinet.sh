#!/usr/bin/env bash
set -euo pipefail

declare -A COMMANDS

# --- scripts podman ---
COMMANDS["up"]="podman compose up -d"
COMMANDS["up:build"]="podman compose up --build -d"
COMMANDS["down"]="podman compose down"
COMMANDS["connect:db:dev"]="podman exec -it dev-kitchen psql -U dratharias -d dev-kitchen"

COMMANDS["clean"]="podman compose down --volumes --remove-orphans && podman system prune -f && podman system prune -a --volumes -f"
COMMANDS["clean:db:nuke"]="podman compose down --volumes --remove-orphans && podman volume rm dev-kitchen_data || true"

COMMANDS["install:frontend"]="podman exec -it meal-ticket-frontend sh -c 'npm install'"
COMMANDS["install:backend"]="podman exec -it meal-ticket-backend sh -c 'npm install && npx tsc --build'"
COMMANDS["install:all"]="${COMMANDS["install:frontend"]} && ${COMMANDS["install:backend"]}"

COMMANDS["update:frontend"]="podman exec -it meal-ticket-frontend sh -c 'npx ncu -u && npm install'"
COMMANDS["update:backend"]="podman exec -it meal-ticket-backend sh -c 'npx ncu -u && npm install && npx tsc --build'"
COMMANDS["update:all"]="${COMMANDS["update:frontend"]} && ${COMMANDS["update:backend"]}"

COMMANDS["prisma:generate"]="podman exec meal-ticket-backend sh -c 'npx prisma generate'"
COMMANDS["prisma:migrate"]="podman exec meal-ticket-backend sh -c 'npx prisma migrate deploy'"
COMMANDS["prisma:push"]="podman exec meal-ticket-backend sh -c 'npx prisma db push'"
COMMANDS["prisma:baseline"]="podman exec meal-ticket-backend sh -c 'npx prisma migrate resolve --applied 20240101000000_init'"
COMMANDS["prisma:init"]="podman exec meal-ticket-backend sh -c 'npx prisma db push --force-reset && npx prisma generate'"
COMMANDS["prisma:seed"]="podman exec meal-ticket-backend sh -c 'node /app/prisma/seed.js'"
COMMANDS["prisma:build:seed"]="podman exec meal-ticket-backend sh -c 'npx prisma generate && sleep 2 && npx prisma db push --accept-data-loss && sleep 2 && node /app/prisma/seed.js'"
COMMANDS["prisma:build:user"]="podman exec meal-ticket-backend sh -c 'npx prisma generate && sleep 2 && npx prisma db push --accept-data-loss && sleep 2 && node /app/prisma/seed-user.js'"

COMMANDS["nuke"]="podman compose down && podman system prune -af --volumes && podman compose up --build -d && podman exec meal-ticket-backend sh -c 'npx prisma generate && sleep 2 && npx prisma db push --accept-data-loss && sleep 2 && node /app/prisma/seed-user.js'"

COMMANDS["rebuild:backend"]="podman compose up --build -d backend"
COMMANDS["prettify"]="podman exec -it meal-ticket-frontend sh -c 'npx prettier --write \"**/*.{js,ts,jsx,tsx,json,css,md}\"'"

show_menu() {
  echo "=== Kitchen Kabinet ==="
  i=1
  for key in "${!COMMANDS[@]}"; do
    printf "%2d) %s\n" "$i" "$key"
    MENU[$i]="$key"
    ((i++))
  done
  echo " q) Quitter"
}

execute_choice() {
  local key=$1
  echo "→ Exécution : ${COMMANDS[$key]}"
  bash -c "${COMMANDS[$key]}"
}

main() {
  while true; do
    declare -A MENU=()
    show_menu
    read -rp "Choix : " choice
    [[ "$choice" == "q" ]] && exit 0
    if [[ -n "${MENU[$choice]:-}" ]]; then
      execute_choice "${MENU[$choice]}"
    else
      echo "Option invalide."
    fi
  done
}

main
