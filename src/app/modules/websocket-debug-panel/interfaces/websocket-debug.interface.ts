import { IncomingMessage, RequestMessage } from 'app/interfaces/api-message.interface';

export interface WebSocketDebugMessage {
  id: string;
  timestamp: Date;
  direction: 'in' | 'out';
  message: IncomingMessage | RequestMessage;
  isMocked?: boolean;
}
