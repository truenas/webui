import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';

export interface HaStatus {
  hasHa: boolean;
  reasons?: FailoverDisabledReason[];
}
