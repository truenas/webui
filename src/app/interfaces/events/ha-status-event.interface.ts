import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';

export interface HaStatus {
  // TODO: Rework to be more descriptive.
  hasHa: boolean;
  reasons?: FailoverDisabledReason[];
}
