import { getAgent } from './registry';
import type { OrchestratorPlan, OrchestratorRun, StepResult } from './types';

export function formatSynthesis(plan: OrchestratorPlan, results: StepResult[]): string {
  const primary = getAgent(plan.primary);
  const lines = [
    `Plano ${plan.mode} · primário ${primary.name} (${primary.companyName})`,
    `Intenção: ${plan.intent}`,
    '',
    'Rota:',
    ...plan.steps.map(
      (step, index) =>
        `${index + 1}. ${getAgent(step.agent).companyName} ${getAgent(step.agent).name} — ${step.reason}`
    ),
  ];
  if (results.length > 0) {
    lines.push('', 'Entrega:');
    for (const result of results) {
      const agent = getAgent(result.agent);
      lines.push(`- ${agent.companyName}: ${result.transport}, exit ${result.exitCode}`);
    }
  }
  return lines.join('\n');
}

export function formatRun(run: OrchestratorRun): string {
  if (run.results.length === 0) return run.synthesis;
  const blocks = run.results.map(
    (result) =>
      `$ ${result.command}\n(${result.transport}, exit ${result.exitCode})\n${result.output}`
  );
  return `${run.synthesis}\n\n---\n${blocks.join('\n\n')}`;
}
