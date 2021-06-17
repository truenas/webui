export type CoreDownloadQuery = [
  /* method */ string,
  /* arguments */ unknown,
  /* filename */ string,
];

export type CoreDownloadResponse = [
  /* jobId */ number,
  /* url */ string,
];
