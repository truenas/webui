import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { VdevType, vdevTypeLabels } from 'app/enums/v-dev-type.enum';
import {
  PoolManagerStore,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@UntilDestroy()
@Component({
  selector: 'ix-new-devices-preview',
  templateUrl: './new-devices-preview.component.html',
  styleUrls: ['./new-devices-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewDevicesPreviewComponent {
  protected readonly vdevTypeLabels = vdevTypeLabels;

  protected topology$ = this.store.topology$;

  constructor(
    private store: PoolManagerStore,
    private translate: TranslateService,
  ) {}

  get unknownProp(): string {
    return this.translate.instant('None');
  }

  isTopologyLimitedToOneLayout(type: string): boolean {
    return type === VdevType.Spare || type === VdevType.Cache;
  }
}
