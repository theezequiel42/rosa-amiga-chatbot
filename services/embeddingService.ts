// services/embeddingService.ts
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

let model: any = null;

/**
 * Loads the Universal Sentence Encoder model.
 * This function is idempotent and will only load the model once.
 */
export const loadEmbeddingModel = async () => {
  if (model) {
    return;
  }
  console.log('Loading embedding model...');
  try {
    // Suppress TensorFlow.js warnings in the console for a cleaner user experience
    tf.env().set('PROD', true);
    model = await use.load();
    console.log('Embedding model loaded successfully.');
  } catch (error) {
    console.error('Failed to load embedding model:', error);
    throw new Error('Could not load the embedding model. RAG features will be disabled.');
  }
};

/**
 * Generates vector embeddings for an array of texts.
 * @param texts An array of strings to embed.
 * @returns A promise that resolves to an array of vector embeddings (number[]).
 */
export const embed = async (texts: string[]): Promise<number[][]> => {
  if (!model) {
    // This should ideally not happen if initializeRag is called first,
    // but it's a good safeguard.
    await loadEmbeddingModel();
  }
  
  const embeddings = await model.embed(texts);
  
  // Convert tensor to a standard JavaScript array
  const embeddingsArray = await embeddings.array();
  
  // Dispose the tensor to free up WebGL memory
  embeddings.dispose();
  
  return embeddingsArray;
};
