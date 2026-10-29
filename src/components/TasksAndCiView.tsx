import React, { useState } from 'react';
import {
  CheckSquare,
  Play,
  Plus,
  FlaskConical,
  Workflow,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  DevTask,
  TestCaseResult,
  CiPipelineStage,
  CliProviderId,
} from '../utils/cliEngine';
import { CompanyLogoSvg } from './CompanyLogos';

interface TasksAndCiViewProps {
  tasks: DevTask[];
  testResults: TestCaseResult[];
  pipelineStages: CiPipelineStage[];
  isRunningTests: boolean;
  isRunningPipeline: boolean;
  onAddTask: (
    title: string,
    cliAgent: Exclude<CliProviderId, 'system'>,
    priority: 'High' | 'Medium' | 'Low',
    linkedFile: string,
    automatedCommand: string
  ) => void;
  onAdvanceTaskStatus: (taskId: string) => void;
  onRunTaskCommand: (task: DevTask) => void;
  onRunTestSuite: () => void;
  onSynthesizeNewTest: (filePath: string) => void;
  onRunCiPipeline: () => void;
}

const TASK_SUGGESTIONS: Array<{
  title: string;
  agent: Exclude<CliProviderId, 'system'>;
  file: string;
}> = [
  {
    title: 'Auditar rate-limiting e proteção contra replay attacks em webhooks',
    agent: 'grok',
    file: 'src/services/githubSync.ts',
  },
  {
    title: 'Gerar guia de arquitetura e contratos JSDoc para módulo de pedidos',
    agent: 'gemini',
    file: 'src/core/orderProcessor.ts',
  },
  {
    title: 'Sintetizar testes de regressão para tokens expirados com skew',
    agent: 'codex',
    file: 'src/auth/tokenGuard.ts',
  },
];

export const TasksAndCiView: React.FC<TasksAndCiViewProps> = ({
  tasks,
  testResults,
  pipelineStages,
  isRunningTests,
  isRunningPipeline,
  onAddTask,
  onAdvanceTaskStatus,
  onRunTaskCommand,
  onRunTestSuite,
  onSynthesizeNewTest,
  onRunCiPipeline,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAgent, setNewTaskAgent] = useState<Exclude<CliProviderId, 'system'>>('gemini');
  const [newTaskPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [newTaskFile, setNewTaskFile] = useState('src/core/orderProcessor.ts');
  const [taskFilter, setTaskFilter] = useState<'all' | DevTask['status']>('all');

  const handleTaskCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const defaultCmdMap: Record<Exclude<CliProviderId, 'system'>, string> = {
      grok: `grok analyze ${newTaskFile} --security`,
      gemini: `gemini docs ${newTaskFile} --write-jsdoc`,
      codex: `codex test ${newTaskFile} --coverage`,
      claude: `claude review ${newTaskFile} --design`,
      gh: `gh pr create --fill`,
    };
    onAddTask(
      newTaskTitle.trim(),
      newTaskAgent,
      newTaskPriority,
      newTaskFile,
      defaultCmdMap[newTaskAgent]
    );
    setNewTaskTitle('');
  };

  const filteredTasks =
    taskFilter === 'all' ? tasks : tasks.filter((t) => t.status === taskFilter);

  const totalAssertions = testResults.reduce((acc, t) => acc + t.assertionCount, 0);
  const passingCount = testResults.filter((t) => t.status === 'Pass').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0284C7]">
            Tarefas Centralizadas, Testes Automatizados & Pipeline CI/CD
          </h1>
          <p className="text-sm text-[#57534E] mt-1">
            Gerencie tarefas vinculadas aos agentes CLI com SVGs oficiais, sugestões inteligentes e entrega contínua.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onSynthesizeNewTest(newTaskFile)}
            className="px-3.5 py-2 bg-[#F3EFE6] hover:bg-[#EAE5D9] border border-[#D97706]/50 text-[#B45309] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <CompanyLogoSvg provider="codex" className="w-3.5 h-3.5" />
            <span>Sintetizar Teste (Codex 1.3)</span>
          </button>
          <button
            type="button"
            onClick={onRunTestSuite}
            disabled={isRunningTests}
            className="px-3.5 py-2 bg-[#F3EFE6] hover:bg-[#EAE5D9] border border-[#0284C7]/50 text-[#0284C7] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <FlaskConical className="w-3.5 h-3.5 text-[#B45309]" />
            <span>{isRunningTests ? 'Executando Testes...' : 'Rodar Testes Automatizados'}</span>
          </button>
          <button
            type="button"
            onClick={onRunCiPipeline}
            disabled={isRunningPipeline}
            className="px-4 py-2 bg-[#B83314] hover:bg-[#9E2B10] text-[#FFF4D6] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Workflow className="w-3.5 h-3.5 text-[#FFF4D6]" />
            <span>{isRunningPipeline ? 'Executando CI/CD...' : 'Disparar Pipeline CI/CD'}</span>
          </button>
        </div>
      </div>

      {/* Section 1: Task Manager Integrated with CLI Agents */}
      <section aria-labelledby="task-board-heading" className="border border-[#E5E0D8] rounded-xl bg-[#FFFDF9] p-5 space-y-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="task-board-heading" className="text-base font-bold text-[#B83314] flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#0284C7]" />
              <span>Fila de Tarefas de Engenharia via CLI</span>
            </h2>
            <p className="text-xs text-[#57534E] mt-0.5">
              Cada tarefa aponta para xAI, Google, OpenAI, Anthropic ou GitHub.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-lg border border-[#E5E0D8]">
            {(['all', 'Backlog', 'In Progress', 'In Review', 'Completed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setTaskFilter(st)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                  taskFilter === st
                    ? 'bg-[#B83314] text-[#FFF4D6] font-bold'
                    : 'text-[#57534E] hover:text-[#0284C7]'
                }`}
              >
                {st === 'all' ? 'Todas' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Task Autocomplete Suggestions */}
        <div className="p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] space-y-2">
          <div className="text-[11px] font-mono font-semibold text-[#B45309] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E11D74]" />
            <span>Sugestões de Tarefas Inteligentes (clique para autocompletar):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TASK_SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setNewTaskTitle(sug.title);
                  setNewTaskAgent(sug.agent);
                  setNewTaskFile(sug.file);
                }}
                className="px-2.5 py-1 rounded-lg border border-[#E5E0D8] bg-[#FFFDF9] text-xs font-mono text-[#0284C7] hover:border-[#0284C7] hover:text-[#B83314] flex items-center gap-1.5"
              >
                <CompanyLogoSvg provider={sug.agent} className="w-3.5 h-3.5 shrink-0" />
                <span>{sug.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Add New Task Form */}
        <form onSubmit={handleTaskCreate} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3.5 rounded-xl border border-[#E5E0D8] bg-[#F3EFE6]">
          <div className="md:col-span-5">
            <label htmlFor="new-task-title" className="block text-xs text-[#57534E] mb-1">
              Nova Tarefa de Desenvolvimento
            </label>
            <input
              id="new-task-title"
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Ex: Adicionar validação de payload no módulo de pedidos"
              className="w-full bg-[#FFFDF9] border border-[#E5E0D8] rounded-lg px-3 py-1.5 text-xs text-[#0284C7] placeholder:text-[#78716C] focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="new-task-agent" className="block text-xs text-[#57534E] mb-1">
              Agente CLI
            </label>
            <select
              id="new-task-agent"
              value={newTaskAgent}
              onChange={(e) => setNewTaskAgent(e.target.value as Exclude<CliProviderId, 'system'>)}
              className="w-full bg-[#FFFDF9] border border-[#E5E0D8] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#B83314]"
            >
              <option value="grok">1.1 Grok CLI</option>
              <option value="gemini">1.2 Gemini CLI</option>
              <option value="codex">1.3 Codex</option>
              <option value="claude">1.5 Claude</option>
              <option value="gh">1.4 GitHub CLI</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="new-task-file" className="block text-xs text-[#57534E] mb-1">
              Arquivo Alvo
            </label>
            <select
              id="new-task-file"
              value={newTaskFile}
              onChange={(e) => setNewTaskFile(e.target.value)}
              className="w-full bg-[#FFFDF9] border border-[#E5E0D8] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#B83314]"
            >
              <option value="src/core/orderProcessor.ts">src/core/orderProcessor.ts</option>
              <option value="src/services/githubSync.ts">src/services/githubSync.ts</option>
              <option value="src/auth/tokenGuard.ts">src/auth/tokenGuard.ts</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-1.5 px-3 bg-[#B83314] hover:bg-[#9E2B10] text-[#FFF4D6] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-[#FFF4D6]" />
              <span>Salvar Tarefa</span>
            </button>
          </div>
        </form>

        {/* High-Density Task Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E0D8] text-xs text-[#B83314]">
                <th className="py-2.5 px-3 font-bold">Chave · Prioridade</th>
                <th className="py-2.5 px-3 font-bold">Tarefa & Arquivo</th>
                <th className="py-2.5 px-3 font-bold">Agente CLI & Comando</th>
                <th className="py-2.5 px-3 font-bold">Status</th>
                <th className="py-2.5 px-3 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D8] text-xs">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="py-3 px-3 font-mono tabular-nums whitespace-nowrap">
                    <span className="text-[#0284C7] font-bold">{task.key}</span>
                    <span className="mx-1.5 text-[#57534E]" aria-hidden="true">·</span>
                    <span
                      className={
                        task.priority === 'High'
                          ? 'text-[#DC2626] font-bold'
                          : task.priority === 'Medium'
                          ? 'text-[#B45309] font-bold'
                          : 'text-[#57534E]'
                      }
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-[#0284C7]">{task.title}</div>
                    <div className="text-[11px] font-mono text-[#57534E] mt-0.5">
                      {task.linkedFile} · {task.branch}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <div className="text-[#B45309] font-semibold flex items-center gap-1.5">
                      <CompanyLogoSvg provider={task.cliAgent} className="w-3.5 h-3.5 shrink-0" />
                      <span>{task.cliAgent} CLI</span>
                    </div>
                    <div className="text-[11px] text-[#0284C7] truncate max-w-xs mt-0.5">
                      $ {task.automatedCommand}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold whitespace-nowrap">
                    <span
                      className={
                        task.status === 'Completed'
                          ? 'text-[#0284C7]'
                          : task.status === 'In Progress'
                          ? 'text-[#B45309]'
                          : task.status === 'In Review'
                          ? 'text-[#E11D74]'
                          : 'text-[#57534E]'
                      }
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap space-x-2">
                    <button
                      type="button"
                      onClick={() => onRunTaskCommand(task)}
                      className="px-2.5 py-1 bg-[#F3EFE6] hover:bg-[#EAE5D9] border border-[#0284C7]/40 text-[#0284C7] hover:text-[#B83314] font-semibold rounded-md transition-colors inline-flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 text-[#E11D74]" />
                      <span>Executar CLI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onAdvanceTaskStatus(task.id)}
                      className="px-2.5 py-1 bg-[#F3EFE6] hover:bg-[#EAE5D9] border border-[#E5E0D8] text-[#57534E] hover:text-[#B83314] font-semibold rounded-md transition-colors"
                    >
                      Avançar Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Automated Test Suite & CI/CD Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Automated Tests */}
        <div className="lg:col-span-6 border border-[#E5E0D8] rounded-xl bg-[#FFFDF9] p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#B83314] flex items-center gap-2">
                <CompanyLogoSvg provider="codex" className="w-4 h-4" />
                <span>Suíte de Testes Automatizados (Codex CLI 1.3)</span>
              </h2>
              <p className="text-xs text-[#57534E] font-mono tabular-nums mt-0.5">
                {passingCount}/{testResults.length} suítes aprovadas · {totalAssertions} asserções verificadas
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#0284C7] tabular-nums whitespace-nowrap shrink-0">
              Cobertura Global: 91.3%
            </span>
          </div>

          <div className="space-y-2.5">
            {testResults.map((testItem) => (
              <div
                key={testItem.id}
                className="p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-[#B45309] font-bold">
                      {testItem.status === 'Pass' ? 'Aprovado' : 'Falha'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#0284C7] font-semibold">{testItem.suite}</span>
                  </div>
                  <p className="text-xs text-[#57534E]">{testItem.name}</p>
                </div>
                <div className="text-right font-mono text-xs text-[#E11D74] tabular-nums shrink-0">
                  <div>{testItem.durationMs}ms</div>
                  <div className="text-[11px] text-[#57534E]">{testItem.assertionCount} asserts</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CI/CD Pipeline Stages */}
        <div className="lg:col-span-6 border border-[#E5E0D8] rounded-xl bg-[#FFFDF9] p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#B83314] flex items-center gap-2">
                <CompanyLogoSvg provider="gh" className="w-4 h-4" />
                <span>Pipeline de Entrega Contínua (CI/CD)</span>
              </h2>
              <p className="text-xs text-[#57534E] mt-0.5">
                Orquestrado via GitHub CLI (<code className="text-[#0284C7] font-semibold">gh workflow</code>) a cada push ou merge.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pipelineStages.map((stage) => (
              <div
                key={stage.id}
                className="p-3.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0284C7] flex items-center gap-2">
                    {stage.status === 'Passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-[#B45309] shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-[#E11D74] shrink-0" />
                    )}
                    <span>{stage.name}</span>
                  </span>
                  <span className="font-mono font-bold tabular-nums text-[#B45309] whitespace-nowrap shrink-0">
                    {stage.status === 'Passed' ? 'Aprovado' : stage.status} · {stage.durationSec}s
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[#E11D74]">
                  $ {stage.command}
                </div>
                <p className="text-xs text-[#57534E]">{stage.outputSummary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
