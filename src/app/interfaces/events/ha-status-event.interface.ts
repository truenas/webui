import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { HaStatusText } from 'app/enums/ha-status-text.enum';

export interface HaStatus {
  status: HaStatusText;
  reasons?: FailoverDisabledReason[];
}
