// services/vectorUtils.ts

/**
 * Calculates the dot product of two vectors.
 * @param vecA The first vector.
 * @param vecB The second vector.
 * @returns The dot product.
 */
export const dotProduct = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) {
    // In a real application, you might want more robust error handling
    console.error('Vectors must have the same length for dot product.');
    return 0;
  }
  return vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
};

/**
 * Calculates the magnitude (or L2 norm) of a vector.
 * @param vec The vector.
 * @returns The magnitude of the vector.
 */
export const magnitude = (vec: number[]): number => {
  return Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
};

/**
 * Calculates the cosine similarity between two vectors.
 * @param vecA The first vector.
 * @param vecB The second vector.
 * @returns A value between -1 and 1 representing the similarity.
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const p = dotProduct(vecA, vecB);
  const mA = magnitude(vecA);
  const mB = magnitude(vecB);
  
  // Handle case where magnitude is zero to avoid division by zero
  if (mA === 0 || mB === 0) {
    return 0;
  }
  
  return p / (mA * mB);
};
