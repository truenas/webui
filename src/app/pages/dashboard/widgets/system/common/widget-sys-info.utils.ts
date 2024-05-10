import { miniSeries, serverSeries } from 'app/constants/server-series.constant';
import { Codename } from 'app/enums/codename.enum';
import { ProductEnclosure } from 'app/enums/product-enclosure.enum';

export function getServerProduct(systemProduct: string): string {
  return serverSeries.find((series) => systemProduct?.includes(series));
}

export function getMiniImagePath(systemProduct: string): string {
  return Object.values(miniSeries).find((series) => series.images.includes(systemProduct))?.pathImg;
}

export function getProductImage(systemProduct: string): string {
  if (!systemProduct) {
    return '';
  }

  if (systemProduct.includes('MINI')) {
    return getMiniImagePath(systemProduct);
  }

  const product = getServerProduct(systemProduct);
  return product ? `/servers/${product}.png` : 'ix-original.svg';
}

export function isRackmount(systemProduct: string): boolean {
  if (systemProduct.includes('MINI')) {
    return !!Object.values(miniSeries)?.find((mini) => mini.images.includes(systemProduct))?.isRackmount;
  }

  return !!serverSeries.find((name) => systemProduct === name);
}

export function getProductEnclosure(systemProduct: string): ProductEnclosure {
  if (systemProduct.includes('MINI')) {
    return ProductEnclosure.Tower;
  }
  return ProductEnclosure.Rackmount;
}

export function getSystemVersion(version: string, codename?: Codename): string {
  if (codename) {
    return version.replace('TrueNAS-SCALE', codename);
  }
  return version;
}
