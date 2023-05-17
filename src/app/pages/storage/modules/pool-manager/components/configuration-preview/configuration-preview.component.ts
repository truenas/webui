import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { vdevTypeLabels } from 'app/enums/v-dev-type.enum';
import {
  PoolManagerStore,
  PoolManagerTopologyCategory,
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

  protected getCategoryDescription(category: PoolManagerTopologyCategory): string {
    if (category.hasCustomDiskSelection) {
      return `${this.translate.instant('Manual layout')} | ${category.vdevs.length} VDEVs`;
    }

    const diskSize = filesize(Number(category.diskSize || 0), { standard: 'iec' });
    return `${category.vdevsNumber} × ${category.layout} | ${category.width} × ${diskSize} (${category.diskType})`;
  }
}
