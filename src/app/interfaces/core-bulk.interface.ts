export type CoreBulkQuery = [
  method: string,
  arguments: unknown[][],
];

export interface CoreBulkResponse<T = unknown> {
  error: string;
  result: T;
}
