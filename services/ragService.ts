// services/ragService.ts

import { KNOWLEDGE_BASE } from '../knowledgeBase';
import type { KnowledgeChunk } from '../types';
import { loadEmbeddingModel, embed } from './embeddingService';
import { cosineSimilarity } from './vectorUtils';

interface VectorizedChunk {
  chunk: KnowledgeChunk;
  embedding: number[];
}

interface ScoredChunk {
  chunk: KnowledgeChunk;
  score: number;
}

let vectorizedKnowledgeBase: VectorizedChunk[] = [];
let isInitialized = false;

// Contact entity index (normalized phrase extracted from contact titles)
let contactEntityPhrases: { id: string; phrase: string }[] = [];

// Fallback clean phrases for contact entries (bypass mojibake in titles)
const CONTACT_ID_TO_PHRASE: Record<string, string> = {
  'contato-creas': 'creas centro de referencia especializado de assistencia social',
  'contato-cras': 'cras centro de referencia de assistencia social',
  'contato-secretaria-assistencia-social': 'secretaria municipal de assistencia social',
  'contato-secretaria-educacao': 'secretaria municipal de educacao sme',
  'contato-cmdm': 'conselho municipal dos direitos da mulher cmdm',
  'contato-procuradoria-mulher': 'procuradoria especial da mulher camara municipal',
  'contato-secretaria-saude': 'secretaria municipal de saude',
  'contato-hospital': 'hospital fraiburgo',
  'contato-samu': 'samu servico movel de urgencia',
  'contato-vigilancia-epidemiologica': 'vigilancia epidemiologica',
  'contato-policia-civil': 'policia civil delegacia sala lilas',
  'contato-policia-militar': 'policia militar rede catarina',
  'contato-bombeiros': 'corpo de bombeiros',
  'contato-mp': 'ministerio publico de santa catarina',
  'contato-judiciario': 'poder judiciario de santa catarina comarca de fraiburgo',
  'contato-oab': 'oab por elas',
};

// Intent tokens indicating the user likely wants contact information
const CONTACT_INTENT_TOKENS = [
  'contato', 'contatos', 'telefone', 'telefones', 'endereco', 'enderecos', 'endereço', 'endereços',
  'horario', 'horarios', 'horário', 'horários', 'funcionamento', 'end', 'falar', 'numero', 'número'
];

/**
 * Initializes the RAG service by loading the embedding model,
 * and creating vector embeddings for each chunk in the knowledge base.
 */
export const initializeRag = async (): Promise<void> => {
  if (isInitialized) {
    return;
  }
  
  await loadEmbeddingModel();

  const textsToEmbed = KNOWLEDGE_BASE.map(
    chunk => `${chunk.title}\n${chunk.content}`
  );
  
  console.log(`Generating embeddings for ${KNOWLEDGE_BASE.length} chunks...`);
  const embeddings = await embed(textsToEmbed);

  vectorizedKnowledgeBase = KNOWLEDGE_BASE.map((chunk, i) => ({
    chunk: chunk,
    embedding: embeddings[i],
  }));

  // Build contact entity phrases from titles for boosting during retrieval
  contactEntityPhrases = KNOWLEDGE_BASE
    .filter(c => c.type === 'contato')
    .map(c => {
      let phrase = extractEntityPhrase(c.title);
      const needsFallback = /�/.test(c.title) || !phrase || /�/.test(phrase);
      if (needsFallback && CONTACT_ID_TO_PHRASE[c.id]) {
        phrase = CONTACT_ID_TO_PHRASE[c.id];
      }
      return { id: c.id, phrase };
    })
    .filter(e => !!e.phrase);

  isInitialized = true;
  console.log('RAG service initialized successfully.');
};

// --- Keyword Search Implementation ---

// Normaliza texto: minúsculas, remove acentos, pontuação e múltiplos espaços
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^\w\s]|_/g, ' ') // Remove punctuation, keep spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
};

// Extracts a normalized entity phrase from a contact title, e.g.,
// "CONTATO - Hospital Fraiburgo" => "hospital fraiburgo"
const extractEntityPhrase = (title: string): string => {
  const norm = normalizeText(title);
  // Remove leading words like 'contato', dashes and content in parentheses
  let phrase = norm.replace(/^contato\s*-\s*/i, '');
  phrase = phrase.replace(/\([^)]*\)/g, ' ');
  phrase = phrase.replace(/\s+\/\s+/g, ' ');
  phrase = phrase.replace(/\s{2,}/g, ' ').trim();
  return phrase;
};

// Expand tokens with simple singular/plural variants
const expandTokens = (tokens: string[]): string[] => {
  const out = new Set<string>();
  for (const t of tokens) {
    out.add(t);
    if (t.endsWith('s')) out.add(t.slice(0, -1));
    else out.add(t + 's');
  }
  return Array.from(out);
};

// Checks whether the query indicates contact intent
const hasContactIntent = (queryNorm: string): boolean => {
  const tokens = queryNorm.split(/\s+/);
  return tokens.some(t => CONTACT_INTENT_TOKENS.includes(t));
};

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const keywordSearch = (query: string, knowledgeBase: KnowledgeChunk[]): ScoredChunk[] => {
  const inputNorm = normalizeText(query);
  const queryTokens = expandTokens(inputNorm.split(/\s+/).filter(Boolean));
  const scores: { [id: string]: number } = {};

  for (const chunk of knowledgeBase) {
    scores[chunk.id] = 0;
    const titleNorm = normalizeText(chunk.title);
    const titleAug = `${titleNorm} ${CONTACT_ID_TO_PHRASE[chunk.id] || ''}`.trim();
    const contentNorm = normalizeText(chunk.content);
    const tagNorm = normalizeText(chunk.tags.join(' '));

    for (const token of queryTokens) {
      if (!token) continue;
      const wordRe = new RegExp(`\\b${escapeRegExp(token)}\\b`, 'i');
      // Exact word matches
      if (wordRe.test(titleAug)) scores[chunk.id] += 4; // Higher weight for title
      if (wordRe.test(tagNorm)) scores[chunk.id] += 3; // Medium weight for tags
      if (wordRe.test(contentNorm)) scores[chunk.id] += 2;
      // Partial fallback matches for longer tokens
      if (token.length >= 5) {
        if (titleAug.includes(token)) scores[chunk.id] += 2;
        if (tagNorm.includes(token)) scores[chunk.id] += 1.5;
        if (contentNorm.includes(token)) scores[chunk.id] += 1;
      }
    }

    // Boost for entity phrase presence in query (for contact items)
    const entity = contactEntityPhrases.find(e => e.id === chunk.id)?.phrase;
    if (entity && inputNorm.includes(entity)) {
      scores[chunk.id] += 10;
    }
  }

  return Object.entries(scores)
    .filter(([, score]) => score > 0)
    .map(([id, score]) => ({
      chunk: knowledgeBase.find(c => c.id === id)!,
      score,
    }))
    .sort((a, b) => b.score - a.score);
};

// --- Reciprocal Rank Fusion (RRF) Implementation ---

const reciprocalRankFusion = (resultsLists: ScoredChunk[][], k: number = 60): ScoredChunk[] => {
  const fusedScores: { [id: string]: number } = {};

  for (const results of resultsLists) {
    for (let i = 0; i < results.length; i++) {
      const rank = i + 1;
      const chunkId = results[i].chunk.id;
      const rrfScore = 1 / (k + rank);
      
      fusedScores[chunkId] = (fusedScores[chunkId] || 0) + rrfScore;
    }
  }

  return Object.entries(fusedScores)
    .map(([id, score]) => ({
      chunk: KNOWLEDGE_BASE.find(c => c.id === id)!,
      score,
    }))
    .sort((a, b) => b.score - a.score);
};

/**
 * Retrieves the most relevant context using a Hybrid Search approach.
 * @param query The user's message.
 * @param topK The number of top results to return.
 * @returns A string containing the concatenated relevant chunks.
 */
export const retrieveContext = async (query: string, topK: number = 5): Promise<string> => {
  if (!isInitialized) {
    throw new Error('RAG service not initialized. Call initializeRag() first.');
  }

  // 1. Perform Semantic Search
  const [queryEmbedding] = await embed([query]);
  const semanticResults: ScoredChunk[] = vectorizedKnowledgeBase.map(item => ({
    chunk: item.chunk,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  })).sort((a, b) => b.score - a.score);

  // 2. Perform Keyword Search
  const keywordResults: ScoredChunk[] = keywordSearch(query, KNOWLEDGE_BASE);

  // 3. Fuse results using RRF
  let fusedResults = reciprocalRankFusion([semanticResults, keywordResults]);
  
  // 3.1 Apply intent-aware boosting for contact queries
  const queryNorm = normalizeText(query);
  if (hasContactIntent(queryNorm)) {
    fusedResults = fusedResults.map(r => {
      let boost = 0;
      if (r.chunk.type === 'contato') boost += 0.3;
      const entity = contactEntityPhrases.find(e => e.id === r.chunk.id)?.phrase;
      if (entity && queryNorm.includes(entity)) boost += 0.7;
      return { chunk: r.chunk, score: r.score + boost };
    }).sort((a, b) => b.score - a.score);
  }
  
  // 4. Get the top K most relevant chunks
  // We apply a baseline semantic relevance threshold to the final fused results
  // to prevent purely keyword-based matches that are semantically unrelated.
  const relevanceThreshold = 0.22;
  const relevantChunks = fusedResults
    .filter(fusedResult => {
        const originalSemanticScore = semanticResults.find(sr => sr.chunk.id === fusedResult.chunk.id)?.score ?? 0;
        return originalSemanticScore > relevanceThreshold || keywordResults.some(kr => kr.chunk.id === fusedResult.chunk.id);
    })
    .slice(0, topK);

  if (relevantChunks.length === 0) {
    return "Nenhum contexto específico encontrado.";
  }

  console.log('Hybrid Search retrieved chunks:', relevantChunks.map(c => ({
      title: c.chunk.title, 
      finalScore: c.score,
      semanticScore: semanticResults.find(sr => sr.chunk.id === c.chunk.id)?.score,
      keywordScore: keywordResults.find(kr => kr.chunk.id === c.chunk.id)?.score,
  })));

  // 5. Format and return the content of the most relevant chunks
  return relevantChunks
    .map(c => `TÍTULO: ${c.chunk.title}\nCONTEÚDO:\n${c.chunk.content}`)
    .join('\n\n---\n\n');
};
