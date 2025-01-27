export type CoreBulkQuery = [
  method: string,
  arguments: unknown[][],
];

export interface CoreBulkResponse<T = unknown> {
  error: string | null;
  result: T;
}
