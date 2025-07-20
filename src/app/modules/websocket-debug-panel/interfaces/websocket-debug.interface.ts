import { IncomingMessage, RequestMessage } from 'app/interfaces/api-message.interface';

export interface WebSocketDebugMessage {
  id: string;
  timestamp: string; // ISO string for serialization
  direction: 'in' | 'out';
  message: IncomingMessage | RequestMessage;
  isMocked?: boolean;
  methodName?: string; // Cached method name for incoming responses
  isExpanded?: boolean; // Track expanded state
}
