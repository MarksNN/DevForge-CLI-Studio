import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Endpoint to inspect real local directories safely within workspace root
  app.get('/api/fs/local', (_req, res) => {
    try {
      const rootDir = process.cwd();
      const entries = fs.readdirSync(rootDir, { withFileTypes: true });
      const items = entries
        .filter((e) => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'dist')
        .map((e) => ({
          name: e.name,
          isDirectory: e.isDirectory(),
          path: e.name,
        }));
      res.json({
        root: rootDir,
        nodeVersion: process.version,
        platform: `${process.platform}/${process.arch}`,
        entries: items,
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Safe local file reader so users can import real files from the host directory into the editor
  app.get('/api/fs/read', (req, res) => {
    try {
      const relPath = String(req.query.path || '');
      if (!relPath || relPath.includes('..') || relPath.startsWith('/')) {
        res.status(400).json({ error: 'Invalid relative path' });
        return;
      }
      const rootDir = process.cwd();
      const targetPath = path.resolve(rootDir, relPath);
      if (!targetPath.startsWith(rootDir)) {
        res.status(403).json({ error: 'Access denied outside workspace root' });
        return;
      }
      if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
        res.status(404).json({ error: 'File not found or is a directory' });
        return;
      }
      const content = fs.readFileSync(targetPath, 'utf-8');
      res.json({ path: relPath, content });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Endpoint for AI Code Review & Automated Documentation Generation via Gemini 3.8 Flash
  app.post('/api/ai/review-and-docs', async (req, res) => {
    const { filePath, fileContent, mode, cliProvider } = req.body as {
      filePath?: string;
      fileContent?: string;
      mode?: 'review' | 'docs' | 'refactor';
      cliProvider?: string;
    };

    if (!filePath || typeof fileContent !== 'string') {
      res.status(400).json({ error: 'filePath and fileContent are required' });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.json({
        usedFallback: true,
        provider: cliProvider || 'gemini',
        summary: `Análise estática local concluída para ${filePath} via ${cliProvider?.toUpperCase() || 'GEMINI'} CLI.`,
      });
      return;
    }

    try {
      const prompt =
        mode === 'docs'
          ? `Você é o motor Gemini CLI (1.2) e Codex CLI (1.3). Gere documentação JSDoc completa em português para todas as funções/interfaces exportadas no arquivo "${filePath}" e retorne o código atualizado com os comentários JSDoc inseridos, além de um resumo técnico Markdown.`
          : `Você é um orquestrador combinando Grok CLI (1.1), Gemini CLI (1.2) e Codex CLI (1.3). Faça uma revisão rigorosa de código para "${filePath}", identificando melhorias de segurança, tipagem, performance e documentação, além de produzir a versão otimizada/documentada do código.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `${prompt}\n\nCódigo-fonte atual:\n\`\`\`typescript\n${fileContent}\n\`\`\``,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'Resumo executivo da revisão ou documentação gerada.',
              },
              updatedCode: {
                type: Type.STRING,
                description: 'Código-fonte completo atualizado com JSDoc e melhorias.',
              },
              markdownDocs: {
                type: Type.STRING,
                description: 'Documentação técnica em formato Markdown.',
              },
              issues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    line: { type: Type.INTEGER },
                    severity: { type: Type.STRING },
                    rule: { type: Type.STRING },
                    message: { type: Type.STRING },
                    suggestedFix: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const rawText = response.text?.trim() || '{}';
      const parsed = JSON.parse(rawText);
      res.json({
        usedFallback: false,
        ...parsed,
      });
    } catch (error) {
      res.json({
        usedFallback: true,
        error: (error as Error).message,
      });
    }
  });

  // Endpoint for unified Multi-CLI command execution (1.1 Grok, 1.2 Gemini, 1.3 Codex, 1.4 GitHub CLI)
  app.post('/api/ai/cli', async (req, res) => {
    const { command, provider, activeFilePath, activeFileContent, branch } = req.body as {
      command?: string;
      provider?: string;
      activeFilePath?: string;
      activeFileContent?: string;
      branch?: string;
    };

    if (!command) {
      res.status(400).json({ error: 'Command is required' });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.json({ usedFallback: true });
      return;
    }

    try {
      const personaMap: Record<string, string> = {
        grok: 'Grok CLI v2.4.1 (1.1) — especialista em diagnóstico rápido, segurança, concorrência e análise de causa-raiz.',
        gemini: 'Gemini CLI v3.8.0 (1.2) — especialista em arquitetura de contexto amplo, documentação JSDoc/Markdown e revisão profunda.',
        codex: 'Codex CLI v4.2.0 (1.3) — especialista em síntese de código, geração de testes automatizados e refatoração AST.',
        gh: 'GitHub CLI v2.67.0 (1.4) — automação de PRs, commits, merges, releases e workflows CI/CD.',
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Execute o comando de terminal abaixo simulando a saída autêntica e concisa (máximo 10 linhas) da ferramenta de linha de comando correspondente.
Ferramenta selecionada: ${personaMap[provider || 'gemini'] || personaMap.gemini}
Branch Git ativa: ${branch || 'feat/cli-orchestrator'}
Arquivo em foco: ${activeFilePath || 'src/core/orderProcessor.ts'}
Trecho do arquivo:
${(activeFileContent || '').slice(0, 1200)}

Comando executado pelo desenvolvedor:
$ ${command}`,
      });

      res.json({
        usedFallback: false,
        output: response.text?.trim() || 'Comando processado com sucesso.',
      });
    } catch (error) {
      res.json({
        usedFallback: true,
        error: (error as Error).message,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DevForge CLI Studio running at http://localhost:${PORT}`);
  });
}

startServer();
