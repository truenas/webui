import { Injectable } from '@angular/core';
import { getMiniImagePath, getServerProduct, isRackmount } from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';

@Injectable({ providedIn: 'root' })
export class ProductImageService {
  getMiniImagePath(systemProduct: string): string {
    return getMiniImagePath(systemProduct);
  }

  getServerProduct(systemProduct: string): string {
    return getServerProduct(systemProduct);
  }

  isRackmount(systemProduct: string): boolean {
    return isRackmount(systemProduct);
  }
}
