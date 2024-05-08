import { Injectable } from '@angular/core';
import { miniSeries, serverSeries } from 'app/constants/server-series.constant';
import { getMiniImagePath, getServerProduct } from 'app/pages/dashboard/widgets/system/widget-sys-info-local/widget-sys-info.utils';

@Injectable({ providedIn: 'root' })
export class ProductImageService {
  getMiniImagePath(platform: string): string {
    return getMiniImagePath(platform);
  }

  getServerProduct(platform: string): string {
    return getServerProduct(platform);
  }

  isRackmount(sysProd: string): boolean {
    let result = null;
    if (sysProd.includes('MINI')) {
      result = !!Object.values(miniSeries).find((mini) => mini.images.includes(sysProd)).isRackmount;
    } else {
      result = !!serverSeries.find((name: string) => sysProd === name);
    }

    return result;
  }
}
