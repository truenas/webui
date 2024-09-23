import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { FailoverDisabledReason, failoverDisabledReasonLabels } from 'app/enums/failover-disabled-reason.enum';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-ha-status-popover',
  templateUrl: './ha-status-popover.component.html',
  styleUrls: ['./ha-status-popover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
    TranslateModule,
    MapValuePipe,
  ],
})
export class HaStatusPopoverComponent {
  protected readonly disabledReasonExplanations = failoverDisabledReasonLabels;

  constructor(
    @Inject(MAT_DIALOG_DATA) public failoverDisabledReasons: FailoverDisabledReason[],
  ) {}
}
