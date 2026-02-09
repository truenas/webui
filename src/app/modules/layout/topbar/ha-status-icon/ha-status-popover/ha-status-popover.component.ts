import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { failoverDisabledReasonLabels } from 'app/enums/failover-disabled-reason.enum';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-ha-status-popover',
  templateUrl: './ha-status-popover.component.html',
  styleUrls: ['./ha-status-popover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
    TranslateModule,
    MapValuePipe,
  ],
})
export class HaStatusPopoverComponent {
  failoverDisabledReasons = inject(MAT_DIALOG_DATA);

  protected readonly disabledReasonExplanations = failoverDisabledReasonLabels;
}
