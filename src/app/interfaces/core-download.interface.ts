export type CoreDownloadQuery = [
  method: string,
  arguments: unknown,
  filename: string,
  buffered?: boolean,
];

export type CoreDownloadResponse = [
  jobId: number,
  url: string,
];
