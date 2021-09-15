import { GlobalActionConfig } from 'app/interfaces/global-action.interface';

export interface GlobalActionsEvent {
  name: 'GlobalActions';
  sender: unknown;
  data: GlobalActionConfig;
}
