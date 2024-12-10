import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { vdevTypeLabels } from 'app/enums/v-dev-type.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-disk-topology-description',
  styleUrl: './disk-topology-description.component.scss',
  templateUrl: './disk-topology-description.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule, MapValuePipe],
})
export class DiskTopologyDescriptionComponent {
  selectedSlot = input.required<DashboardEnclosureSlot>();

  protected readonly vdevTypeLabels = vdevTypeLabels;
}
