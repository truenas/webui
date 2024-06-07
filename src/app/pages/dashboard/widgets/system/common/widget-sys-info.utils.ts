import { miniSeries, serverSeries } from 'app/constants/server-series.constant';
import { Codename } from 'app/enums/codename.enum';
import { ProductEnclosure } from 'app/enums/product-enclosure.enum';

export function getServerProduct(systemProduct: string): string {
  return serverSeries.find((series) => systemProduct?.includes(series));
}

export function getMiniImagePath(systemProduct: string): string {
  const normalizedProduct = systemProduct
    .replace('TRUENAS-', '')
    .replace('FREENAS-', '');
  return Object.values(miniSeries).find((series) => series.images.includes(normalizedProduct))?.pathImg;
}

export function getProductImage(systemProduct: string): string {
  if (!systemProduct) {
    return '';
  }

  let product: string;

  if (systemProduct.includes('MINI')) {
    product = getMiniImagePath(systemProduct);
  } else {
    product = getServerProduct(systemProduct) ? `servers/${getServerProduct(systemProduct)}.png` : 'ix-original.svg';
  }

  return product ? `assets/images/${product}` : '';
}

export function isRackmount(systemProduct: string): boolean {
  if (systemProduct.includes('MINI')) {
    return !!Object.values(miniSeries)?.find((mini) => mini.images.includes(systemProduct))?.isRackmount;
  }

  return !!serverSeries.find((name) => systemProduct === name);
}

export function getProductEnclosure(systemProduct: string): ProductEnclosure {
  if (!systemProduct) {
    return null;
  }
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
