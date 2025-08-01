import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { failoverDisabledReasonLabels } from 'app/enums/failover-disabled-reason.enum';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-ha-status-popover',
  templateUrl: './ha-status-popover.component.html',
  styleUrls: ['./ha-status-popover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    TranslateModule,
    MapValuePipe,
  ],
})
export class HaStatusPopoverComponent {
  failoverDisabledReasons = inject(MAT_DIALOG_DATA);

  protected readonly disabledReasonExplanations = failoverDisabledReasonLabels;
}
