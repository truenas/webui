export enum IncomingApiMessageType {
  Changed = 'changed',
  Added = 'added',
  Removed = 'removed',
  Result = 'result',
  Connected = 'connected',
  Pong = 'pong',
  Method = 'method',
  NoSub = 'nosub',

  // Special type added on the frontend
  Discard = 'discard',
}
