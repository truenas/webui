export enum IncomingApiMessageType {
  Changed = 'changed',
  Added = 'added',
  Removed = 'removed',
  Result = 'result',
  Connected = 'connected',
  Pong = 'pong',
  Method = 'method',
  Ready = 'ready',
  NoSub = 'nosub',

  // Special type added on the frontend
  Discard = 'discard',
}

export enum OutgoingApiMessageType {
  Connect = 'connect',
  UnSub = 'unsub',
  Sub = 'sub',
  Ping = 'ping',
}
