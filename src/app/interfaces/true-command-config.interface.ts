import { TrueCommandStatus } from 'app/enums/true-command-status.enum';

export interface TrueCommandConfig {
  api_key: string | null;
  enabled: boolean;
  id: number;
  remote_ip_address: string;
  remote_url: string;
  status: TrueCommandStatus;
  status_reason: string;
}

export interface TrueCommandConnectionState {
  connected: boolean;
  status: TrueCommandStatus;
  status_reason: string;
  truecommand_ip: string;
  truecommand_url: string;
}

export interface UpdateTrueCommand {
  enabled: boolean;
  api_key?: string | null;
}

export interface TrueCommandUpdateResponse extends TrueCommandConnectionState {
  enabled: boolean;
}
