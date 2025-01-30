import { miniSeries, serverSeries } from 'app/constants/server-series.constant';
import { Codename } from 'app/enums/codename.enum';
import { ProductEnclosure } from 'app/enums/product-enclosure.enum';

export function getServerProduct(systemProduct: string): string | undefined {
  return serverSeries.find((series) => systemProduct?.includes(series));
}

export function getProductImageSrc(
  systemProduct: string,
  cropDefaultImg = false,
): string | null {
  const defaultImg = cropDefaultImg ? 'ix-original-cropped.png' : 'ix-original.svg';
  const getProductImageName = (productName: string): string | null => {
    if (productName?.includes('MINI')) {
      const getImage = Object.values(miniSeries).find(
        (series) => series.images.includes(productName),
      )?.pathImg;
      return getImage || null;
    }
    const product = serverSeries.find((series) => productName?.includes(series));
    return product ? `/servers/${product}.png` : null;
  };

  const imgName = getProductImageName(systemProduct);
  if (!imgName) {
    return 'assets/images/' + defaultImg;
  }
  return 'assets/images' + (imgName.startsWith('/') ? imgName : ('/' + imgName));
}

export function getProductEnclosure(systemProduct: string): ProductEnclosure | null {
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
    return version.replace('TrueNAS-COMMUNITY_EDITION', codename);
  }
  return version;
}
