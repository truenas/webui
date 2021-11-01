export interface ParseAndFormatIxInput {
  (value: string | number): { parsed: string | number; formatted: string | number };
}
