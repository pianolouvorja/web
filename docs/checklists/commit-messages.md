# Mensagens de commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/), em português, focando no **porquê** (ou no efeito), não na lista de arquivos.

## Formato

```text
tipo: resumo curto no imperativo

[corpo opcional — o que mudou e por quê]
```

- **Resumo:** até ~72 caracteres, sem ponto final
- **Imperativo:** “adiciona”, “corrige”, “atualiza” (como uma ordem)
- **Um commit** = uma intenção coerente

## Tipos comuns

| Tipo | Quando usar |
|------|-------------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Só documentação |
| `refactor` | Mudança de código sem alterar comportamento |
| `style` | Formatação / lint sem lógica |
| `chore` | Build, deps, tarefas de manutenção |
| `test` | Testes |
| `perf` | Performance |

## Exemplos

```text
feat: adiciona lock da liturgia por dia da semana
```

```text
fix: evita overflow do logo no viewport mobile
```

```text
docs: documenta convenções de commit e checklist de PR
```

```text
refactor: extrai preferências de projeção para service dedicado
```

```text
chore: atualiza .gitignore para publicar docs de onboarding
```

## Evite

```text
❌ update
❌ ajustes
❌ fix bug
❌ feat: alterações em LiturgyView.vue e useLiturgy.ts
```

Prefira descrever o **efeito para o usuário ou o sistema**, não o diff.

## Branches (alinhado ao commit)

- `feat/<descricao-curta>`
- `fix/<descricao-curta>`
- `chore/<descricao-curta>`
- `docs/<descricao-curta>`
