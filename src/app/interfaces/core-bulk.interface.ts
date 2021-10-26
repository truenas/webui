export type CoreBulkQuery = [
  method: string,
  arguments: any[][],
];

export interface CoreBulkResponse<T = unknown> {
  error: string;
  result: T;
}
