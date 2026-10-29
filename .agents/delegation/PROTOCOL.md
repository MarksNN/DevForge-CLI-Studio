# PROTOCOLO DE DELEGAÃ‡ÃƒO E HANDOFFS

## 1. Estrutura
Solicitante: 00 ou agente especializado. DestinatÃ¡rio: agente com competÃªncia e permissÃ£o. Todo handoff pertence a um project_id e task_id. A pasta local de cada agente contÃ©m `delegations`, `handoffs`, `memory`, `skills`, `runs` e `reviews`.

## 2. Contrato mÃ­nimo
- de / para / projeto / task_id / objetivo / prioridade;
- escopo e arquivos autorizados;
- contexto e evidÃªncias relevantes, sem segredos;
- dependÃªncias e recursos exclusivos;
- CLI/modelo selecionados e status de verificaÃ§Ã£o;
- critÃ©rios de aceite, testes e deadline quando fornecido;
- bloqueios, resultado e revisÃ£o.

## 3. Procedimento
00 cria missÃ£o -> agente verifica contexto e permissÃµes -> executa -> registra evidÃªncia -> abre handoff para outro domÃ­nio quando necessÃ¡rio -> 22 pode verificar persistÃªncia -> 24 audita -> 00 consolida.

## 4. Estados
PENDENTE, EM_EXECUCAO, AGUARDANDO_DEPENDENCIA, EM_TESTE, EM_REVISAO, APROVADO, REPROVADO, BLOQUEADO, CANCELADO.

## 5. RestriÃ§Ãµes
NÃ£o delegar para aumentar privilÃ©gios. Proibida a circulaÃ§Ã£o de credenciais em handoffs. Nenhum agente altera prompt ou atribuiÃ§Ãµes de outro. DelegaÃ§Ã£o nÃ£o significa execuÃ§Ã£o concluÃ­da. O executor nÃ£o emite sua prÃ³pria aprovaÃ§Ã£o independente.
