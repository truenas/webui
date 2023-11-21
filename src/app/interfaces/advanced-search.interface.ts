export enum ContextType {
  Property = 'property',
  Logical = 'logical',
  Comparator = 'comparator',
}

export interface QueryContext {
  type: ContextType;
  startPosition: number;
  endPosition: number;
  tokens: string[];
  lastToken: string;
  query: string;
}
