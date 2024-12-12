import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { helptextManager } from 'app/helptext/storage/volumes/manager/manager';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@UntilDestroy()
@Component({
  selector: 'ix-custom-layout-applied',
  templateUrl: './custom-layout-applied.component.html',
  styleUrls: ['./custom-layout-applied.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class CustomLayoutAppliedComponent {
  readonly type = input.required<VdevType>();
  readonly vdevs = input.required<DetailsDisk[][]>();

  readonly manualDiskSelectionMessage = helptextManager.manual_disk_selection_message;

  constructor(
    protected poolManagerStore: PoolManagerStore,
  ) {
    this.poolManagerStore.resetStep$.pipe(untilDestroyed(this)).subscribe((vdevType: VdevType) => {
      if (vdevType === this.type()) {
        this.resetLayout();
      }
    });
  }

  resetLayout(): void {
    this.poolManagerStore.resetTopologyCategory(this.type());
  }
}
