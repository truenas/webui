import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ManagerVdev } from 'app/classes/manager-vdev.class';
import { ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/store/manual-disk-selection-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-enclosure-wrapper',
  templateUrl: './enclosure-wrapper.component.html',
  styleUrls: ['./enclosure-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnclosureWrapperComponent {
  @Input() enclosure: number;
  @Input() vdev: ManagerVdev;

  constructor(
    public store$: ManualDiskSelectionStore,
  ) { }
}
