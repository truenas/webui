export enum FailoverStatus {
  Master = 'MASTER',
  Backup = 'BACKUP',
  Electing = 'ELECTING',
  Importing = 'IMPORTING',
  Error = 'ERROR',
  Single = 'SINGLE',
}
