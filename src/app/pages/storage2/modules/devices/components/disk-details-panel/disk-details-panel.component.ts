import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Disk, isTopologyDisk, TopologyItem } from 'app/interfaces/storage.interface';

@Component({
  selector: 'ix-disk-details-panel',
  templateUrl: './disk-details-panel.component.html',
  styleUrls: ['./disk-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskDetailsPanelComponent {
  @Input() topologyItem: TopologyItem;
  @Input() topologyParentItem: TopologyItem;
  @Input() disk: Disk;

  get title(): string {
    if (isTopologyDisk(this.topologyItem)) {
      return this.topologyItem.disk || this.topologyItem.guid;
    }

    return this.topologyItem.type;
  }

  get isVdevDisk(): boolean {
    return isTopologyDisk(this.topologyItem);
  }
}
