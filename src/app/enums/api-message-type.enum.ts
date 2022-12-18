export enum IncomingApiMessageType {
  Changed = 'changed',
  Added = 'added',
  Removed = 'removed',
  Result = 'result',
  Connected = 'connected',
  Pong = 'pong',
  Ready = 'ready',
  NoSub = 'nosub',
}

export enum OutgoingApiMessageType {
  Method = 'method',
  Connect = 'connect',
  UnSub = 'unsub',
  Sub = 'sub',
  Ping = 'ping',
}
