export interface ParseAndFormatIxInput {
  (value: string): { parsed: string; formatted: string };
}
