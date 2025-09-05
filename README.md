# Rosa Amiga 🌸

Apoio e conscientização contra a violência doméstica.

Um chatbot em React que oferece suporte, informações e recursos para pessoas em situação de violência doméstica, com foco em privacidade e acessibilidade.

## Sobre o Projeto

A Rosa Amiga é uma aplicação web que usa IA (Google Gemini) e RAG (Retrieval‑Augmented Generation) para responder de forma segura, clara e contextualizada. Todo o processamento de recuperação de contexto roda no navegador do usuário para maximizar a privacidade.

## Funcionalidades

- Interface de chat intuitiva e responsiva
- Modo de voz em tempo real (Web Speech API)
- Visualização de áudio 3D interativa (Three.js + Web Audio API)
- IA conversacional com Google Gemini
- Busca híbrida (semântica + palavra‑chave) com RRF
- RAG 100% client‑side com TensorFlow.js
- Botão de Saída Rápida para segurança
- Páginas de Ajuda, Privacidade e Termos

## Tecnologias

- React 19 • TypeScript • Vite
- Google GenAI (`@google/genai`)
- TensorFlow.js • Universal Sentence Encoder
- Three.js
- Tailwind CSS via CDN (configurado em `index.html`)

## RAG com Busca Híbrida (client‑side)

1. Busca semântica: embeddings com Universal Sentence Encoder (TensorFlow.js) para entender intenção e significado.
2. Busca por palavra‑chave: correspondência de termos para itens como nomes, endereços e telefones.
3. Fusão por RRF: combina as duas listas, priorizando resultados consistentes em ambos os métodos.
4. Contexto aumentado: os trechos mais relevantes são enviados ao Gemini para respostas mais precisas.

## Pré‑requisitos

- Node.js 18+
- npm (ou pnpm/yarn)
- Chave de API do Google Gemini

## Instalação

1) Clone o repositório
   ```bash
   git clone https://github.com/theezequiel42/rosa-amiga-chatbot
   cd rosa-amiga-chatbot
   ```

2) Instale as dependências
   ```bash
   npm install
   ```

3) Configure as variáveis de ambiente
   Crie um arquivo `.env.local` na raiz do projeto (não versionado) com:
   ```
   GEMINI_API_KEY=suachaveaqui
   ```
   Observação: o build injeta `process.env.API_KEY` a partir de `GEMINI_API_KEY` (ver `vite.config.ts`).

4) Rode em desenvolvimento
   ```bash
   npm run dev
   ```

5) Acesse no navegador
   Geralmente em `http://localhost:5173`.

## Scripts Disponíveis

- `npm run dev`: inicia o servidor de desenvolvimento
- `npm run build`: gera o build de produção
- `npm run preview`: serve o build localmente para pré‑visualização

## Estrutura do Projeto

```
components/
  AudioVisualizer.tsx   # Visualização 3D do áudio
  ChatInterface.tsx     # Interface de chat
  Emoji.tsx             # Ícones/emoji auxiliares
  MessageBubble.tsx     # Balões de mensagem
  VoiceInterface.tsx    # UI do modo de voz

hooks/
  useVoiceProcessor.ts  # Captura de microfone, STT e dados de frequência

services/
  embeddingService.ts   # Geração de embeddings (TensorFlow.js)
  geminiService.ts      # Integração com Google Gemini (@google/genai)
  ragService.ts         # RAG com busca híbrida + RRF
  vectorUtils.ts        # Utilidades de vetores (cosseno etc.)

public/
  _headers              # Cabeçalhos (deploy)
  help.html             # Página de ajuda
  privacy.html          # Política de privacidade
  terms.html            # Termos de uso
  sw.js                 # Service Worker (PWA)
  stickers/             # Imagens usadas nas respostas

App.tsx                 # Layout/estrutura principal
constants.ts            # Constantes e instruções do sistema
knowledgeBase.ts        # Base de conhecimento local (RAG)
types.ts                # Tipos TypeScript
index.html              # HTML principal (Tailwind via CDN)
index.tsx               # Ponto de entrada React
vite.config.ts          # Injeta API Key e aliases
tsconfig.json           # Configuração TypeScript
package.json            # Scripts e dependências
metadata.json           # Metadados (permissões, nome etc.)
.env.local              # Variáveis locais (ignorado pelo Git)
```

## Informações Importantes

- Emergência: em caso de perigo imediato, ligue para 190
- Central de Atendimento à Mulher: 180
- Este é um projeto de apoio e não substitui ajuda profissional

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit (`git commit -m 'feat: nova feature'`)
4. Push (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Licenciado sob a licença MIT.

—

Desenvolvido com carinho para ajudar quem precisa 💜

## Deploy

### Vercel

1) Crie um novo projeto e selecione este repositório.
2) Framework: Vite • Build: `npm run build` • Output: `dist`.
3) Variáveis de ambiente (Project Settings → Environment Variables):
   - `GEMINI_API_KEY` = sua chave.
4) Deploy. A Vercel servirá o conteúdo estático de `dist/`.

Obs.: a chave será embutida no bundle do frontend (client‑side). Se precisar ocultá‑la, use um backend/proxy para chamadas ao Gemini.

### Netlify

1) New site → Import from Git.
2) Build command: `npm run build` • Publish directory: `dist`.
3) Site settings → Environment variables:
   - `GEMINI_API_KEY` = sua chave.
4) Deploy. O arquivo `public/_headers` será copiado para `dist/` automaticamente.
