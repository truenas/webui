import { miniSeries, serverSeries } from 'app/constants/server-series.constant';

export function getServerProduct(systemProduct: string): string {
  return serverSeries.find((series) => systemProduct.includes(series)) || '';
}

export function getMiniImagePath(systemProduct: string): string {
  return Object.values(miniSeries).find((series) => series.images.includes(systemProduct))?.pathImg || '';
}

export function getProductImage(systemProduct: string): string {
  if (systemProduct.includes('MINI')) {
    return getMiniImagePath(systemProduct);
  }

  const product = getServerProduct(systemProduct);
  return product ? `/servers/${product}.png` : 'ix-original.svg';
}
