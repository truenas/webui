import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { vdevTypeLabels } from 'app/enums/v-dev-type.enum';
import {
  PoolManagerStore,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@UntilDestroy()
@Component({
  selector: 'ix-configuration-preview',
  templateUrl: './configuration-preview.component.html',
  styleUrls: ['./configuration-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationPreviewComponent {
  protected readonly vdevTypeLabels = vdevTypeLabels;

  protected name$ = this.store.name$;
  protected encryption$ = this.store.encryption$;
  protected topology$ = this.store.topology$;
  protected totalCapacity$ = this.store.totalUsableCapacity$;

  constructor(
    private store: PoolManagerStore,
    private translate: TranslateService,
  ) {}

  get unknownProp(): string {
    return this.translate.instant('None');
  }
}
