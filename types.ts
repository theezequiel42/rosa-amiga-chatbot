
export enum Sender {
  User = 'user',
  Bot = 'bot',
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: Sender;
  imageUrl?: string;
  icon?: { name: string };
}

export interface KnowledgeChunk {
  id: string;
  title: string;
  content: string;
  type: 'contato' | 'definicao' | 'servico' | 'procedimento' | 'emergencia' | 'geral';
  tags: string[];
}
