export enum ApiErrorName {
  NotAuthenticated = 'ENOTAUTHENTICATED',
  NoAccess = 'EACCES',
  NoMemory = 'ENOMEM',
  AlreadyExists = 'EEXIST',
  Again = 'EAGAIN',
  Validation = 'EINVAL',
}

export const apiErrorNames = new Map<ApiErrorName, string>([
  [ApiErrorName.NotAuthenticated, 'Not Authenticated'],
  [ApiErrorName.NoAccess, 'Access Error'],
  [ApiErrorName.NoMemory, 'No Memory'],
  [ApiErrorName.AlreadyExists, 'Already Exists'],
  [ApiErrorName.Again, 'Try Again'],
  [ApiErrorName.Validation, 'Validation Error'],
]);

export enum JsonRpcErrorCode {
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  TooManyConcurrentCalls = -32000,
  CallError = -32001,
}

export enum CollectionChangeType {
  Changed = 'changed',
  Added = 'added',
  Removed = 'removed',
}

export enum ShellMessageType {
  Connected = 'connected',
}
