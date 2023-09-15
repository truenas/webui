import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import helptext from 'app/helptext/topbar';

@Component({
  selector: 'ix-ha-status-popover',
  templateUrl: './ha-status-popover.component.html',
  styleUrls: ['./ha-status-popover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HaStatusPopoverComponent {
  protected readonly disabledReasonExplanations = helptext.ha_disabled_reasons;

  constructor(
    @Inject(MAT_DIALOG_DATA) public failoverDisabledReasons: FailoverDisabledReason[],
  ) {}
}
