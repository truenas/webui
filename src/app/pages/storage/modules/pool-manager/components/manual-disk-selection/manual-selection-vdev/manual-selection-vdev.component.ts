import { Component, Input } from '@angular/core';
import { ManagerVdev } from 'app/interfaces/vdev-info.interface';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';

@Component({
  selector: 'ix-manual-selection-vdev',
  templateUrl: './manual-selection-vdev.component.html',
  styleUrls: ['./manual-selection-vdev.component.scss'],
})
export class ManualSelectionVdevComponent {
  @Input() vdev: ManagerVdev;

  get spansEnclosures(): boolean {
    if (!this.vdev.disks.length) {
      return false;
    }
    const enclosure = this.vdev.disks[0].enclosure;
    return this.vdev.disks.some(
      (disk) => disk.enclosure.number !== enclosure.number || disk.enclosure.slot !== enclosure.slot,
    );
  }
  constructor(public ixFormatter: IxFormatterService) {}
}
