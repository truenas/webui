import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { EnclosureDiskStatus, enclosureDiskStatusLabels } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-mini-slot-status',
  templateUrl: './mini-slot-status.component.html',
  styleUrl: './mini-slot-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
    TranslateModule,
    MapValuePipe,
  ],
})
export class MiniSlotStatusComponent {
  readonly slot = input.required<DashboardEnclosureSlot>();

  readonly EnclosureDiskStatus = EnclosureDiskStatus;

  readonly enclosureDiskStatusLabels = enclosureDiskStatusLabels;
}
