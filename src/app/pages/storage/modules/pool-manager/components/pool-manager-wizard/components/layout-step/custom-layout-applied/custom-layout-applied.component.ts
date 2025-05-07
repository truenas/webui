import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@UntilDestroy()
@Component({
  selector: 'ix-custom-layout-applied',
  templateUrl: './custom-layout-applied.component.html',
  styleUrls: ['./custom-layout-applied.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class CustomLayoutAppliedComponent {
  readonly type = input.required<VDevType>();
  readonly vdevs = input.required<DetailsDisk[][]>();

  readonly manualDiskSelectionMessage = helptextPoolCreation.diskSelectionMessage;

  constructor(
    protected poolManagerStore: PoolManagerStore,
  ) {
    this.poolManagerStore.resetStep$.pipe(untilDestroyed(this)).subscribe((vdevType: VDevType) => {
      if (vdevType === this.type()) {
        this.resetLayout();
      }
    });
  }

  resetLayout(): void {
    this.poolManagerStore.resetTopologyCategory(this.type());
  }
}
