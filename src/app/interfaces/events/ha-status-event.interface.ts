import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';

export interface HaStatusEvent {
  name: 'HA_Status';
  sender: unknown;
  data: HaStatus;
}

export interface HaStatus {
  status: 'HA Enabled' | 'HA Disabled';
  reasons?: FailoverDisabledReason[];
}
