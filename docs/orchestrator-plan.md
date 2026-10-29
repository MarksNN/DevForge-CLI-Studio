# DevForge — plano do orquestrador CLI

DevForge deixa de ser um estúdio que imita vários CLIs com um único modelo e passa a ser o plano de controle entre agentes de empresas diferentes. A interface continua em React (Vite). O servidor Express guarda as chaves e fala com cada empresa. O navegador nunca vê segredo.

## Diagnóstico

| Área | Hoje | Efeito |
| --- | --- | --- |
| Identidade | Sidebar ainda é um CRM (AtlasGR / Total Trac, Bitrix24) com rótulos de CLI | O produto não parece um orquestrador |
| Execução | `grok`, `gemini` e `codex` caem no mesmo Gemini, ou em texto fixo | Não há delegação real entre empresas |
| Claude | Ausente | Anthropic fica fora do circuito |
| Git, CI e testes | Estado em memória e `localStorage` | Não opera no repositório de verdade |
| Workspace | Arquivos de demonstração (`orderProcessor`, `tokenGuard`) | O editor não é o código do host |
| Chatbook | Respostas gravadas no cliente | Não há handoff nem memória entre agentes |
| Segurança do disco | `startsWith` no caminho absoluto | Prefixo `/repo-evil` passaria em `/repo` |
| Saúde | Todo mundo "Ready" com latência fictícia | Não dá para saber quem tem chave |
| Política | Nenhum comando `devforge` | Não existe roteamento, fan-out nem handoff |

## Arquitetura

```
React (terminal, chatbook, editor)
        │  POST /api/orchestrator/run
        ▼
DevForge (plano de controle, servidor)
        │  política determinística + síntese
        ├── xAI        Grok     XAI_API_KEY      grok-4.7
        ├── Google     Gemini   GEMINI_API_KEY
        ├── OpenAI     Codex    OPENAI_API_KEY
        ├── Anthropic  Claude   ANTHROPIC_API_KEY
        └── GitHub     gh       GH_TOKEN         ainda motor local
```

A política de rota é determinística e testada. Quando a chave da empresa existe, a etapa daquela empresa usa a API dela. Quando não existe, o motor local responde e diz qual variável falta. A síntese de um fan-out com duas ou mais etapas usa o Grok 4.7 (xAI) se `XAI_API_KEY` estiver definida. Caso contrário, a síntese também é local.

Comandos do plano de controle:

- `devforge status` — quem está com API e quem está no motor local
- `devforge route <intenção>` — mostra o agente primário e o motivo, sem fan-out
- `devforge run <intenção>` — executa o roteamento automático
- `devforge fanout <intenção>` — até três empresas, na ordem em que a intenção cita cada especialidade
- `devforge handoff <origem> <destino> <nota>` — a origem prepara o pacote e o destino recebe a nota

Especialidades da política: segurança e diagnóstico (xAI), documentação e arquitetura (Google), código e testes (OpenAI), crítica de desenho (Anthropic), entrega (GitHub).

## Esta execução

1. Núcleo em `src/orchestrator/` com registro, roteador, motor local e testes.
2. `GET /api/orchestrator/health` e `POST /api/orchestrator/run`. Chaves só no servidor.
3. Adaptadores HTTP: xAI Responses (`grok-4.7`), Gemini (SDK já presente), OpenAI Chat Completions, Anthropic Messages. GitHub permanece local até a fase do binário.
4. Terminal e Chatbook em React passam a falar com o orquestrador. Claude entra como agente 1.5.
5. Leitura de arquivo recusa caminho que escape da raiz do workspace.
6. Estado salvo no navegador ganha agentes novos sem apagar o workspace antigo.

Fora desta execução, de propósito: spawn de binários, git real, editor no disco do host, troca da sidebar de CRM.

## Fases seguintes

1. **Binários com allowlist.** Se `grok`, `gemini`, `codex`, `claude` ou `gh` existirem no PATH, executar só subcomandos permitidos, com `cwd` no workspace e sem shell. A API continua como fallback.
2. **Workspace real.** O editor lê e grava arquivos do repositório aberto, com a mesma trava de caminho. Os arquivos de demonstração viram um exemplo, não a fonte.
3. **Git real.** `git` e `gh` allowlisted substituem commit, branch e PR simulados. O estado em memória espelha o resultado, não o inventa.
4. **Sessão de handoff.** Cada entrega guarda pacote (agente, comando, saída, arquivo, branch). O próximo agente recebe só esse pacote, com teto de tamanho.
5. **Sidebar do orquestrador.** Trocar os módulos de CRM por: empresas, rotas, sessão, segredos (só status) e fila. AtlasGR / Total Trac saem do núcleo.
6. **Streaming.** Resposta token a token no terminal e no Chatbook, uma empresa por vez, na ordem do plano.

## Como provar agora

```bash
npm test
npm run lint
```

No terminal da interface, ou via API:

```bash
devforge status
devforge fanout auditar tokenGuard, documentar o contrato e preparar o pull request
devforge handoff grok claude revisar o achado de clock skew
```

Grok entra pela sessão já gravada pelo `grok login` (`~/.grok/auth.json`, ou `GROK_AUTH_PATH`). O servidor lê o token a cada chamada e não copia a credencial para o repositório. `XAI_API_KEY` só é usada quando essa sessão não existe ou está vencida. As outras empresas só respondem com a chave delas. Modelo de cada uma pode ser trocado por `XAI_MODEL`, `GEMINI_MODEL`, `OPENAI_MODEL` e `ANTHROPIC_MODEL`.
