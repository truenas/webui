export type CoreBulkQuery = [
  /* method */ string,
  /* arguments */ any[][],
];

export interface CoreBulkResponse {
  error: string;
}
