import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { PoolManagerTopologyCategory } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@Pipe({
  name: 'ixTopologyCategoryDescription',
})
export class TopologyCategoryDescriptionPipe implements PipeTransform {
  private translate = inject(TranslateService);


  transform(category: PoolManagerTopologyCategory, notLimitedToOneLayout = true, ignoreManualLayout = false): string {
    if (category.vdevs.length === 0) {
      return this.translate.instant('None');
    }

    if (category.hasCustomDiskSelection && !ignoreManualLayout) {
      return `${this.translate.instant('Manual layout')} | ${category.vdevs.length} VDEVs`;
    }

    // Handle case where disk info is not available (e.g., manually selected spare disks)
    if (category.diskSize === null || category.diskType === null || category.width === null) {
      const totalDisks = category.vdevs.flat().length;
      const diskLabel = totalDisks === 1 ? this.translate.instant('disk') : this.translate.instant('disks');
      return `${totalDisks} ${diskLabel}`;
    }

    const layoutTypeData = notLimitedToOneLayout ? `${category.vdevsNumber} × ${category.layout} | ` : '';

    const diskSize = buildNormalizedFileSize(Number(category.diskSize || 0));
    return `${layoutTypeData}${category.width} × ${diskSize} (${category.diskType})`;
  }
}
