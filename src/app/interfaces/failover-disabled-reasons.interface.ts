import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';

export interface FailoverDisabledReasonEvent {
  disabled_reasons: FailoverDisabledReason[];
}
