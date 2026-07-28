---
name: nutrisnap-commit
description: Create Git commits in the NutriSnap repository using the requested Karen or Mateo identity. Use when the user asks to crear commit, hacer commit, guardar cambios, commit as/como Karen, commit as/como Mateo, KarenTriana, Mateo, Msilva, or asks Codex to choose the proper local Git identity/author for a commit without storing secrets in the repo.
---

# NutriSnap Commit

Use this skill to create Git commits for this repository with the correct local author identity.

## Guardrails

- Never store tokens, private keys, SSH keys, personal access tokens, or secret environment values in this skill.
- Do not print secret values from the environment. Refer to env var names only.
- Keep private credentials in the user's shell environment, Git config, credential manager, SSH agent, or GPG agent.
- Inspect the worktree before staging or committing. Do not revert user changes.
- Stage only the files that belong to the requested commit. If scope is ambiguous, ask one concise question.

## Identity Selection

Select the identity from the user's wording:

- `karen`: use when the user says Karen, KarenTriana, or "como Karen".
- `mateo`: use when the user says Mateo, Msilva, Msilva-debug, or "como Mateo".
- If neither identity is specified, ask whether to commit as Karen or Mateo before committing.

The helper loads local values from the repository root before selecting the identity:

1. `NUTRISNAP_COMMIT_ENV_FILE` when explicitly set.
2. `.env`
3. `.env.local`

Use `.env.example` as the safe template and copy it to `.env` or `.env.local` on each machine. These real env files are ignored by Git.

Supported values:

- Karen: `NUTRISNAP_KAREN_GIT_NAME`, `NUTRISNAP_KAREN_GIT_EMAIL`
- Mateo: `NUTRISNAP_MATEO_GIT_NAME`, `NUTRISNAP_MATEO_GIT_EMAIL`
- Optional signing key ids: `NUTRISNAP_KAREN_GIT_SIGNING_KEY`, `NUTRISNAP_MATEO_GIT_SIGNING_KEY`

If the variables are not set, use these non-secret fallbacks:

- Karen: `KarenTriana <KarenTriana@users.noreply.github.com>`
- Mateo: `Mateo Silva <91212536+Msilva-debug@users.noreply.github.com>`

Store only non-secret commit metadata in `.env`. GitHub tokens, SSH private keys, GPG private keys, and private key contents must remain in the OS credential manager, `ssh-agent`, `gpg-agent`, Git credential helper, or another local secret manager. A signing key id or fingerprint can be stored in `.env`; the private key itself cannot.

## Workflow

1. Run `git status --short`.
2. Inspect relevant diffs before staging, especially when there are existing unrelated changes.
3. Stage the intended paths with `git add <path...>`.
4. Write a concise Spanish imperative commit subject that follows this repo's history.
5. Commit through the helper:

```bash
bash .agents/skills/nutrisnap-commit/scripts/commit-with-author.sh karen -m "Mensaje del commit"
bash .agents/skills/nutrisnap-commit/scripts/commit-with-author.sh mateo -m "Mensaje del commit" -m "Detalle opcional."
```

6. Report the commit hash and the identity used.

## Helper Script

Use `scripts/commit-with-author.sh` for commits. It accepts the identity as the first argument and forwards every remaining argument to `git commit`.
