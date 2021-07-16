import { TrueCommandStatus } from 'app/enums/true-command-status.enum';

export interface TrueCommandConfig {
  api_key: string;
  enabled: boolean;
  id: number;
  remote_ip_address: string;
  remote_url: string;
  status: TrueCommandStatus;
  status_reason: string;
}
