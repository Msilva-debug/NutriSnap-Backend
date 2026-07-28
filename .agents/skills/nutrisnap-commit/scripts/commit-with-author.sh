#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
Usage:
  commit-with-author.sh <karen|mateo> <git commit args...>

Examples:
  commit-with-author.sh karen -m "Agrega validacion de formulario"
  commit-with-author.sh mateo -m "Conecta recomendaciones a servicio" -m "Actualiza la pantalla y el contrato."

Optional local environment overrides:
  NUTRISNAP_KAREN_GIT_NAME
  NUTRISNAP_KAREN_GIT_EMAIL
  NUTRISNAP_KAREN_GIT_SIGNING_KEY
  NUTRISNAP_MATEO_GIT_NAME
  NUTRISNAP_MATEO_GIT_EMAIL
  NUTRISNAP_MATEO_GIT_SIGNING_KEY

The script loads .env and .env.local from the Git repository root before
selecting the identity. Use NUTRISNAP_COMMIT_ENV_FILE to load a specific file.
USAGE
}

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

load_env_file() {
  local env_file="$1"
  local line key value first_char last_char

  [[ -f "$env_file" ]] || return 0

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    line="$(trim "$line")"

    [[ -z "$line" || "$line" == \#* ]] && continue

    if [[ "$line" =~ ^export[[:space:]]+(.+)$ ]]; then
      line="${BASH_REMATCH[1]}"
    fi

    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      value="$(trim "${BASH_REMATCH[2]}")"

      if [[ ${#value} -ge 2 ]]; then
        first_char="${value:0:1}"
        last_char="${value: -1}"
        if [[ "$first_char" == "$last_char" && ( "$first_char" == '"' || "$first_char" == "'" ) ]]; then
          value="${value:1:${#value}-2}"
        fi
      fi

      export "$key=$value"
    fi
  done < "$env_file"
}

value_or_default() {
  local variable_name="$1"
  local fallback="$2"
  local value="${!variable_name:-}"

  if [[ -n "$value" ]]; then
    printf '%s' "$value"
  else
    printf '%s' "$fallback"
  fi
}

if [[ $# -lt 2 ]]; then
  usage
  exit 2
fi

identity="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
shift

git_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -n "$git_root" ]]; then
  if [[ -n "${NUTRISNAP_COMMIT_ENV_FILE:-}" ]]; then
    load_env_file "$NUTRISNAP_COMMIT_ENV_FILE"
  else
    load_env_file "$git_root/.env"
    load_env_file "$git_root/.env.local"
  fi
fi

case "$identity" in
  karen|karentriana)
    git_name="$(value_or_default NUTRISNAP_KAREN_GIT_NAME "KarenTriana")"
    git_email="$(value_or_default NUTRISNAP_KAREN_GIT_EMAIL "KarenTriana@users.noreply.github.com")"
    git_signing_key="${NUTRISNAP_KAREN_GIT_SIGNING_KEY:-}"
    ;;
  mateo|msilva|msilva-debug)
    git_name="$(value_or_default NUTRISNAP_MATEO_GIT_NAME "Mateo Silva")"
    git_email="$(value_or_default NUTRISNAP_MATEO_GIT_EMAIL "91212536+Msilva-debug@users.noreply.github.com")"
    git_signing_key="${NUTRISNAP_MATEO_GIT_SIGNING_KEY:-}"
    ;;
  *)
    echo "Unknown identity: $identity" >&2
    usage
    exit 2
    ;;
esac

git rev-parse --is-inside-work-tree >/dev/null

if git diff --cached --quiet --exit-code; then
  echo "No staged changes. Stage the intended files before committing." >&2
  exit 1
fi

export GIT_AUTHOR_NAME="$git_name"
export GIT_AUTHOR_EMAIL="$git_email"
export GIT_COMMITTER_NAME="$git_name"
export GIT_COMMITTER_EMAIL="$git_email"

git_config=(-c "user.name=$git_name" -c "user.email=$git_email")
if [[ -n "$git_signing_key" ]]; then
  git_config+=(-c "user.signingkey=$git_signing_key")
fi

git "${git_config[@]}" commit "$@"
