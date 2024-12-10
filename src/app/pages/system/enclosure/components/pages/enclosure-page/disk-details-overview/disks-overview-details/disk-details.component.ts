import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { enclosureDiskStatusLabels } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-disk-details',
  templateUrl: './disk-details.component.html',
  styleUrls: ['./disk-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    MapValuePipe,
    DecimalPipe,
  ],
})
export class DiskDetailsComponent {
  readonly selectedSlot = input.required<DashboardEnclosureSlot>();

  readonly enclosureDiskStatusLabels = enclosureDiskStatusLabels;
}
