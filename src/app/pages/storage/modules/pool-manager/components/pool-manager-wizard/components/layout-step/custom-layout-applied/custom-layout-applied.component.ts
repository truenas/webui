import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { VdevType } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@Component({
  selector: 'ix-custom-layout-applied',
  templateUrl: './custom-layout-applied.component.html',
  styleUrls: ['./custom-layout-applied.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomLayoutAppliedComponent {
  @Input() type: VdevType;
  @Input() vdevs: UnusedDisk[][];
  @Output() manualSelectionClicked = new EventEmitter<void>();

  readonly manualDiskSelectionMessage = helptext.manual_disk_selection_message;

  constructor(
    private poolManagerStore: PoolManagerStore,
  ) {}

  openManualDiskSelection(): void {
    this.manualSelectionClicked.emit();
  }

  resetLayout(): void {
    this.poolManagerStore.resetTopologyCategory(this.type);
  }
}
