# Checklist — Pull Request (Web)

- [ ] Branch nomeada (`feat/`, `fix/`, `chore/`)
- [ ] Commits no padrão conventional — ver `docs/checklists/commit-messages.md`
- [ ] Issue ou descrição clara do problema/solução
- [ ] Type-check OK
- [ ] Lint OK
- [ ] Build OK (`npm run build`)
- [ ] Smoke em viewport mobile (~375px) se a UI foi afetada
- [ ] Popups / multi-tela testados se a mudança tocar projeção
- [ ] Sem secrets (`.env`, tokens) no diff
- [ ] Textos de UI via i18n (pt-BR), sem hardcode novo
