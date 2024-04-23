import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EnclosureUi } from 'app/interfaces/enclosure.interface';
import { Disk } from 'app/interfaces/storage.interface';

@Component({
  selector: 'ix-enclosure-dashboard',
  templateUrl: './enclosure-dashboard.component.html',
  styleUrls: ['./enclosure-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnclosureDashboardComponent {
  /** Get the enclosure data in this component using the `webui.enclosure.dashboard` endpoint
   * (getEnclosure method from EnclosureService) */
  enclosure: EnclosureUi;
  selectedDisk: Disk;
}
