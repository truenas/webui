import { miniSeries, serverSeries } from 'app/constants/server-series.constant';
import { Codename } from 'app/enums/codename.enum';
import { ProductEnclosure } from 'app/enums/product-enclosure.enum';
import { SystemInfo } from 'app/interfaces/system-info.interface';

export function getServerProduct(systemProduct: string): string {
  return serverSeries.find((series) => systemProduct?.includes(series));
}

export function getProductImageSrc(systemInfo: SystemInfo): string | null {
  const systemProduct = systemInfo.system_product;
  const getProductImageName = (productName: string): string | null => {
    if (productName?.includes('MINI')) {
      const getImage = Object.values(miniSeries).find(
        (series) => series.images.includes(productName),
      )?.pathImg;
      return getImage || null;
    }
    const product = serverSeries.find((series) => productName?.includes(series));
    if (product) {
      return `/servers/${product}.png`;
    }
    return null;
  };

  const imgName = getProductImageName(systemProduct);
  return imgName != null ? 'assets/images' + (imgName.startsWith('/') ? imgName : ('/' + imgName)) : null;
}

/**
 * @deprecated We should look at webui.enclosure.dashboard instead
 * TODO: Update.
 */
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
