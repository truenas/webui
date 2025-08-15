import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
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
  protected poolManagerStore = inject(PoolManagerStore);

  readonly type = input.required<VDevType>();
  readonly vdevs = input.required<DetailsDisk[][]>();

  readonly manualDiskSelectionMessage = helptextPoolCreation.diskSelectionMessage;

  constructor() {
    this.poolManagerStore.resetStep$.pipe(untilDestroyed(this)).subscribe((vdevType: VDevType) => {
      if (vdevType === this.type()) {
        this.resetLayout();
      }
    });
  }

  private resetLayout(): void {
    this.poolManagerStore.resetTopologyCategory(this.type());
  }
}
