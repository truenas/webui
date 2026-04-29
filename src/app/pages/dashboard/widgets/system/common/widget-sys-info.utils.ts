import { formatInTimeZone } from 'date-fns-tz';
import { miniSeries, serverSeries } from 'app/constants/server-series.constant';
import { ProductEnclosure } from 'app/enums/product-enclosure.enum';
import { ApiDate } from 'app/interfaces/api-date.interface';
import { License } from 'app/interfaces/system-info.interface';
import { LocaleService } from 'app/modules/language/locale.service';

export function getServerProduct(systemProduct: string): string | undefined {
  return serverSeries.find((series) => systemProduct?.includes(series));
}

export function getProductImageSrc(systemProduct: string): string | null {
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
    return null;
  }
  return 'assets/images' + (imgName.startsWith('/') ? imgName : ('/' + imgName));
}

/**
 * Format a license expiration `ApiDate` for display in the user's preferred date
 * format. The wire value is a calendar date (`YYYY-MM-DD`) parsed as UTC midnight,
 * so we format in UTC to keep the displayed date stable regardless of the user's
 * local time zone.
 */
export function formatLicenseExpiration(
  expiresAt: ApiDate | null | undefined,
  localeService: LocaleService,
): string | null {
  const value = expiresAt?.$value;
  if (!value) {
    return null;
  }
  return formatInTimeZone(new Date(value), 'UTC', localeService.getPreferredDateFormat());
}

/**
 * Pick the license expiration date, tolerating the legacy `contract_end` field
 * still emitted by `webui.main.dashboard.sys_info` (which the dashboard widgets
 * consume). The new `truenas.license.info` endpoint surfaces `expires_at`.
 *
 * Remove the `contract_end` fallback once the dashboard endpoint is migrated
 * to the new shape.
 */
export function getLicenseExpiration(license: License | null | undefined): ApiDate | null | undefined {
  if (!license) {
    return null;
  }
  const legacyContractEnd = (license as License & { contract_end?: ApiDate | null }).contract_end;
  return license.expires_at ?? legacyContractEnd ?? null;
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
