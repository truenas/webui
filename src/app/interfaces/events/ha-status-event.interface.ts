import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';

export interface HaStatus {
  status: 'HA Enabled' | 'HA Disabled';
  reasons?: FailoverDisabledReason[];
}
