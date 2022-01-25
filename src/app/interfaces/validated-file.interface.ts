export interface ValidatedFile {
  file?: File;
  error?: ValidatedFileError;
}

export interface ValidatedFileError {
  name: string;
  errorMessage: string;
}
