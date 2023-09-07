import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { PoolManagerTopologyCategory } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@Pipe({
  name: 'ixTopologyCategoryDescription',
})
export class TopologyCategoryDescriptionPipe implements PipeTransform {
  constructor(
    private translate: TranslateService,
  ) {}

  transform(category: PoolManagerTopologyCategory): string {
    if (category.vdevs.length === 0) {
      return this.translate.instant('None');
    }

    if (category.hasCustomDiskSelection) {
      return `${this.translate.instant('Manual layout')} | ${category.vdevs.length} VDEVs`;
    }

    const diskSize = filesize(Number(category.diskSize || 0), { standard: 'iec' });
    return `${category.vdevsNumber} × ${category.layout} | ${category.width} × ${diskSize} (${category.diskType})`;
  }
}
