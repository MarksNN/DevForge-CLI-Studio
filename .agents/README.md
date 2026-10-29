# Agentes universais â€” DevForge CLI Studio

Esta pasta foi criada pelo instalador `Instalar-29-Agentes-DevForge.ps1`.

- `agents/<id>-<slug>/PROMPT.md`: prompt completo com governanÃ§a global e especializaÃ§Ã£o.
- `agents/<id>-<slug>/manifest.json`: identidade, competÃªncia, relaÃ§Ãµes e CLI candidata.
- `agents/<id>-<slug>/persona.json`: personagem digital, personalidade, aparÃªncia e estados.
- `agents/<id>-<slug>/avatar.svg`: avatar SVG simples inicial (nÃ£o Ã© a arte final).
- `agents/<id>-<slug>/delegations/ROUTES.md`: rotas de colaboraÃ§Ã£o, handoffs e aceite.
- `agents/<id>-<slug>/memory/README.md`: escopo de aprendizado.
- `prompts/<id>-<slug>.md`: espelho gerado para compatibilidade com o layout da governanÃ§a antiga.
- `registry/agents.json`: catÃ¡logo geral.
- `governance/UNIVERSAL.md`: governanÃ§a nova, sem editar o AGENTS.md da raiz.
- `delegation/PROTOCOL.md`: protocolo compartilhado.

Importante: esta Ã© a **estrutura e os prompts**. NÃ£o integra automaticamente os agentes ao frontend/backend nem garante execuÃ§Ã£o real das CLIs. A engenharia de runtime, memÃ³ria e adaptadores requer implementaÃ§Ã£o e testes prÃ³prios. `manifest.execution.status` comeÃ§a em `NOT_VERIFIED`.

Para repetir sem perda, rode o instalador normalmente: ele preserva arquivos existentes diferentes. Para atualizar arquivos gerenciados, use `-OverwriteManaged`: cada alteraÃ§Ã£o serÃ¡ precedida de backup em `.agents/_backups`.

NÃ£o edite as duas cÃ³pias de prompt independentemente: `agents/.../PROMPT.md` Ã© a referÃªncia principal. Regere o espelho `prompts/` somente apÃ³s reconciliar mudanÃ§as.
