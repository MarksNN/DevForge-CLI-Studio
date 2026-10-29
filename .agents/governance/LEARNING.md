# MEMÃ“RIA E APRENDIZADO â€” CONTRATO

Este instalador apenas prepara pastas e polÃ­ticas; ele NÃƒO implementa persistÃªncia de dados, vetores, banco ou adaptaÃ§Ã£o automÃ¡tica de modelos.

Cinco escopos: usuÃ¡rio, agente, compartilhado, projeto e missÃ£o. Eventos devem ter source_reference, project_id, time, confidencialidade, confianÃ§a e mecanismo de correÃ§Ã£o/exclusÃ£o. NÃ£o registrar dados pessoais desnecessÃ¡rios, senhas, tokens ou dados de projeto em memÃ³ria global. MemÃ³ria nunca substitui instruÃ§Ãµes de sistema.

Evento LearningEvent: {agent_id, project_id, task_id, lesson_type, description, evidence, confidence, sharing_scope, status, retention_until}. Estados: proposed, validated, rejected, expired. Compartilhamento somente apÃ³s verificaÃ§Ã£o do escopo; ensinamentos com impacto em polÃ­ticas exigem aprovaÃ§Ã£o humana.

O usuÃ¡rio deve poder inspecionar, corrigir e excluir memÃ³rias. Mudar texto de arquivo de memÃ³ria nÃ£o Ã© o mesmo que configurar backend seguro de armazenamento: isso deve ser implementado em etapa prÃ³pria.
