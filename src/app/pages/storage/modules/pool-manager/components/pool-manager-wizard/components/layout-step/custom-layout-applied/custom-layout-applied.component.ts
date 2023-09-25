import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { VdevType } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@UntilDestroy()
@Component({
  selector: 'ix-custom-layout-applied',
  templateUrl: './custom-layout-applied.component.html',
  styleUrls: ['./custom-layout-applied.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomLayoutAppliedComponent {
  @Input() type: VdevType;
  @Input() vdevs: UnusedDisk[][];

  readonly manualDiskSelectionMessage = helptext.manual_disk_selection_message;

  constructor(
    protected poolManagerStore: PoolManagerStore,
  ) {
    this.poolManagerStore.resetStep$.pipe(untilDestroyed(this)).subscribe((vdevType: VdevType) => {
      if (vdevType === this.type) {
        this.resetLayout();
      }
    });
  }

  resetLayout(): void {
    this.poolManagerStore.resetTopologyCategory(this.type);
  }
}
