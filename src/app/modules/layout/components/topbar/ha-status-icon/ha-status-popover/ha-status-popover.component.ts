import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FailoverDisabledReason, failoverDisabledReasonLabels } from 'app/enums/failover-disabled-reason.enum';

@Component({
  selector: 'ix-ha-status-popover',
  templateUrl: './ha-status-popover.component.html',
  styleUrls: ['./ha-status-popover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HaStatusPopoverComponent {
  protected readonly disabledReasonExplanations = failoverDisabledReasonLabels;

  constructor(
    @Inject(MAT_DIALOG_DATA) public failoverDisabledReasons: FailoverDisabledReason[],
  ) {}
}
