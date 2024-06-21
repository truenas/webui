import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { vdevTypeLabels } from 'app/enums/v-dev-type.enum';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';

@Component({
  selector: 'ix-disk-topology-description',
  styleUrl: './disk-topology-description.component.scss',
  templateUrl: './disk-topology-description.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskTopologyDescriptionComponent {
  selectedSlot = input.required<DashboardEnclosureSlot>();

  protected readonly vdevTypeLabels = vdevTypeLabels;
}
