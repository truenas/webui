import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Disk, VDev } from 'app/interfaces/storage.interface';

@Component({
  selector: 'ix-disk-details-panel',
  templateUrl: './disk-details-panel.component.html',
  styleUrls: ['./disk-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskDetailsPanelComponent {
  @Input() topologyItem: VDev;
  @Input() topologyParentItem: VDev;
  @Input() disk: Disk;
}
