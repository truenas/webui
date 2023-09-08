import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { vdevTypeLabels } from 'app/enums/v-dev-type.enum';
import { isTopologyLimitedToOneLayout } from 'app/helpers/storage.helper';
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
  protected isLimitedToOneLayout = isTopologyLimitedToOneLayout;

  get unknownProp(): string {
    return this.translate.instant('None');
  }

  constructor(
    private store: PoolManagerStore,
    private translate: TranslateService,
  ) {}
}
