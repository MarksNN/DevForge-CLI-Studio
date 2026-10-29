import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryManager } from '../core/MemoryManager';
import { LearningManager } from '../core/LearningManager';
import { AgentRegistry } from '../core/AgentRegistry';
import { CoordinatorService } from '../core/CoordinatorService';
import { IndependentAuditor } from '../core/IndependentAuditor';
import { CliAdapterManager } from '../providers/CliAdapterManager';
import type { UniversalTask } from '../core/types';

test('Fase 2: Catálogo de 29 Especialistas e SYSTEM_CORE', () => {
  const registry = new AgentRegistry();
  const all = registry.getAllAgents();
  assert.equal(all.length, 29, 'O catálogo deve conter exatamente 29 perfis cadastrados');

  const corePrompt = registry.getSystemCorePrompt();
  assert.ok(corePrompt.includes('SYSTEM_CORE'), 'Deve carregar o SYSTEM_CORE.md');
  assert.ok(corePrompt.includes('AGENTE:'), 'SYSTEM_CORE deve definir formato obrigatório da entrega');

  // Verifica presença de perfis-chave
  assert.ok(registry.getAgent('00'), 'Agente 00 (NEXO) deve existir');
  assert.ok(registry.getAgent('01A'), 'Agente 01A (SAFIRA) deve existir');
  assert.ok(registry.getAgent('19'), 'Agente 19 (LUMEN) deve existir');
  assert.ok(registry.getAgent('20'), 'Agente 20 (COMPASSO) deve existir');
  assert.ok(registry.getAgent('24'), 'Agente 24 (VERITAS) deve existir');
  assert.ok(registry.getAgent('25'), 'Agente 25 (NÔMADE) deve existir');

  const fullPrompt00 = registry.getFullPrompt('00');
  assert.ok(fullPrompt00.includes('Coordenador Universal'), 'Prompt composto deve conter a especialidade do Agente 00');
});

test('Teste A — Aprendizado com o usuário (M1)', () => {
  const mm = new MemoryManager();
  const lm = new LearningManager(mm);

  const pref = lm.recordUserPreference({
    content: 'Prefiro funções utilitárias exportadas com nomes camelCase e JSDoc em português.',
    projectId: null,
  });

  assert.equal(pref.type, 'preference');
  assert.equal(pref.scope, 'user');

  const retrieved = mm.query({ scope: 'user', queryText: 'camelCase' });
  assert.ok(retrieved.length >= 1, 'Deve recuperar a preferência salva na camada M1');
  assert.ok(retrieved[0].content.includes('camelCase'));
});

test('Teste B — Aprendizado entre especialistas (M3)', () => {
  const mm = new MemoryManager();
  const lm = new LearningManager(mm);

  // Agente 08 detecta regressão, Agente 01 corrige e gera LearningEvent
  const event = lm.processLearningEvent({
    originAgentId: '08',
    specialty: 'QA',
    projectId: 'devforge-default',
    problem: 'Timeout em queries não indexadas',
    contextAllowed: 'performance metrics',
    hypothesis: 'Falta de índice composto',
    solutionApplied: 'Adição de index no schema',
    testsPerformed: 'npm test executado com sucesso',
    observedResult: 'Tempo de query reduzido de 800ms para 12ms',
    reusableLesson: 'Sempre indexar chaves estrangeiras em consultas de alto volume.',
    confidenceScore: 0.95,
    interestedAgentIds: ['01', '01A', '16'],
    requiresReview: false,
  });

  assert.equal(event.type, 'lesson');
  assert.equal(event.approved_for_sharing, true);

  const sharedLessons = mm.query({ scope: 'shared', queryText: 'indexar chaves' });
  assert.ok(sharedLessons.length >= 1, 'Outro especialista deve conseguir recuperar a lição compartilhada');
});

test('Teste C — Isolamento de Projeto (M4)', () => {
  const mm = new MemoryManager();
  const testFact = `Configuração confidencial do Projeto Alpha: porta interna 9090 (${Date.now()})`;

  // Memória restrita ao Projeto Alpha
  mm.createMemory({
    scope: 'project',
    owner_id: 'agent_01',
    agent_id: '01',
    project_id: 'projeto-alpha',
    type: 'fact',
    content: testFact,
    source_type: 'observation',
    source_reference: 'alpha-config',
    confidence: 1.0,
    status: 'validated',
    expires_at: null,
    sensitive: false,
    approved_for_sharing: false,
  });

  // Consulta vinda do Projeto Beta
  const betaQuery = mm.query({ project_id: 'projeto-beta', queryText: testFact });
  assert.equal(betaQuery.length, 0, 'O Projeto Beta JAMAIS pode recuperar memórias do Projeto Alpha');

  // Consulta vinda do próprio Projeto Alpha
  const alphaQuery = mm.query({ project_id: 'projeto-alpha', queryText: testFact });
  assert.equal(alphaQuery.length, 1, 'O Projeto Alpha recupera sua própria memória com sucesso');
});

test('Teste D — Correção de memória com versionamento', () => {
  const mm = new MemoryManager();

  const mem = mm.createMemory({
    scope: 'agent',
    owner_id: 'agent_03',
    agent_id: '03',
    project_id: null,
    type: 'skill',
    content: 'Utilizar sempre contraste 3:1 para botões secundários.',
    source_type: 'observation',
    source_reference: 'ref-1',
    confidence: 0.7,
    status: 'validated',
    expires_at: null,
    sensitive: false,
    approved_for_sharing: false,
  });

  assert.equal(mem.version, 1);

  // Usuário ou especialista corrige a memória
  const updated = mm.updateMemory(mem.memory_id, 'Utilizar rigorosamente contraste 4.5:1 (WCAG AA) para botões.', 'Correção de acessibilidade');
  assert.ok(updated);
  assert.equal(updated.version, 2);
  assert.equal(updated.history?.length, 2);
  assert.ok(updated.content.includes('4.5:1'));
});

test('Teste E — Exclusão efetiva de memória', () => {
  const mm = new MemoryManager();

  const temp = mm.createMemory({
    scope: 'agent',
    owner_id: 'agent_15',
    agent_id: '15',
    project_id: null,
    type: 'fact',
    content: 'Dado temporário para exclusão.',
    source_type: 'observation',
    source_reference: 'audit-run',
    confidence: 0.9,
    status: 'validated',
    expires_at: null,
    sensitive: false,
    approved_for_sharing: false,
  });

  assert.ok(mm.getMemory(temp.memory_id));
  const deleted = mm.deleteMemory(temp.memory_id);
  assert.equal(deleted, true);
  assert.equal(mm.getMemory(temp.memory_id), null, 'Memória excluída não deve existir mais');

  const search = mm.query({ queryText: 'temporário para exclusão' });
  assert.equal(search.length, 0, 'Busca não deve retornar memória excluída');
});

test('Teste F — Tolerância e Fallback Transparente de CLI', async () => {
  const manager = new CliAdapterManager();
  const unknownAdapter = manager.getAdapter('pi');
  assert.ok(unknownAdapter);

  const res = await unknownAdapter.execute({
    executionId: 'exec_test_1',
    agentId: '19',
    systemPrompt: 'prompt',
    userPrompt: 'Pesquisar sobre WebSockets',
    workingDir: process.cwd(),
  });

  assert.equal(res.isFallback, true, 'Deve indicar expressamente fallback quando binário não está instalado');
  assert.ok(res.cliUsed.includes('FALLBACK_LOCAL_DETERMINISTICO'), 'Mensagem transparente deve declarar ausência do binário sem simulação falsa');
});

test('Teste G — Coordenador Universal seleciona especialistas sem amarras a projetos específicos', () => {
  const coordinator = new CoordinatorService();

  const planWeb = coordinator.planMission('Criar banco de dados Postgres e schema de usuários com segurança e RLS');
  const idsWeb = planWeb.selectedAgents.map(a => a.id);
  assert.ok(idsWeb.includes('00'), '00 é o coordenador');
  assert.ok(idsWeb.includes('01'), '01 deve ser chamado para banco de dados');
  assert.ok(idsWeb.includes('01A'), '01A deve ser chamado para RLS e integridade');
  assert.ok(idsWeb.includes('24'), '24 auditor independente é mandatório');

  const planMobile = coordinator.planMission('Desenvolver tela mobile para Android e iOS com sincronização offline');
  const idsMobile = planMobile.selectedAgents.map(a => a.id);
  assert.ok(idsMobile.includes('09'), '09 mobile deve ser selecionado');
});

test('Teste H — Auditoria Independente reprova entregas sem evidências', () => {
  const auditor = new IndependentAuditor();

  const invalidTask: UniversalTask = {
    task_id: 'task_invalida_1',
    project_id: 'devforge-default',
    agent_id: '01',
    objective: 'Implementar autenticação JWT',
    context_references: [],
    allowed_paths: ['src/auth.ts'],
    permissions: ['write'],
    dependencies: [],
    expected_artifacts: ['src/auth.ts'],
    acceptance_criteria: ['JWT assinado'],
    timeout_seconds: 30,
    budget_limit: 1000,
    review_required: true,
    status: 'EM_REVISAO',
    created_at: new Date().toISOString(),
    evidence: [], // Sem evidências!
  };

  const report = auditor.auditTask(invalidTask);
  assert.equal(report.decision, 'REPROVADO', 'Sem evidências reais, a auditoria DEVE reprovar a entrega');
  assert.ok(report.findings.some(f => f.includes('Ausência de evidências')));

  // Agora com evidências reais
  invalidTask.evidence = ['Unit tests pass: 12 tests passed in auth.test.ts', 'Token verified locally'];
  const reportValid = auditor.auditTask(invalidTask);
  assert.equal(reportValid.decision, 'APROVADO', 'Com evidências e critérios satisfeitos, deve aprovar');
});
