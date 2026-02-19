import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { ProductType } from 'app/enums/product-type.enum';

/**
 * Alert classes restricted to specific product types.
 * Classes not listed here are available for both COMMUNITY_EDITION and ENTERPRISE.
 * For updates to this see `alert.list_categories`.
 */
const restrictedAlertClasses: Partial<Record<AlertClassName, ProductType[]>> = {
  // HA (Enterprise-only)
  [AlertClassName.NoCriticalFailoverInterfaceFound]: [ProductType.Enterprise],
  [AlertClassName.FailoverSyncFailed]: [ProductType.Enterprise],
  [AlertClassName.VrrpStatesDoNotAgree]: [ProductType.Enterprise],
  [AlertClassName.DisksAreNotPresentOnActiveNode]: [ProductType.Enterprise],
  [AlertClassName.DisksAreNotPresentOnStandbyNode]: [ProductType.Enterprise],
  [AlertClassName.FailoverStatusCheckFailed]: [ProductType.Enterprise],
  [AlertClassName.FailoverFailed]: [ProductType.Enterprise],
  [AlertClassName.FailoverInterfaceNotFound]: [ProductType.Enterprise],
  [AlertClassName.NetworkCardsMismatchOnActiveNode]: [ProductType.Enterprise],
  [AlertClassName.NetworkCardsMismatchOnStandbyNode]: [ProductType.Enterprise],
  [AlertClassName.FailoverRemoteSystemInaccessible]: [ProductType.Enterprise],
  [AlertClassName.FailoverKeysSyncFailed]: [ProductType.Enterprise],
  [AlertClassName.FailoverKmipKeysSyncFailed]: [ProductType.Enterprise],
  [AlertClassName.TrueNasVersionsMismatch]: [ProductType.Enterprise],

  // Hardware (Enterprise-only)
  [AlertClassName.UsbStorage]: [ProductType.Enterprise],
  [AlertClassName.EnclosureHealthy]: [ProductType.Enterprise],
  [AlertClassName.EnclosureUnhealthy]: [ProductType.Enterprise],
  [AlertClassName.JbofRedfishComm]: [ProductType.Enterprise],
  [AlertClassName.NvdimmInvalidFirmwareVersion]: [ProductType.Enterprise],
  [AlertClassName.JbofElementCritical]: [ProductType.Enterprise],
  [AlertClassName.JbofElementWarning]: [ProductType.Enterprise],
  [AlertClassName.JbofInvalidData]: [ProductType.Enterprise],
  [AlertClassName.MemorySizeMismatch]: [ProductType.Enterprise],
  [AlertClassName.NvdimmEsLifetimeCritical]: [ProductType.Enterprise],
  [AlertClassName.NvdimmEsLifetimeWarning]: [ProductType.Enterprise],
  [AlertClassName.NvdimmRecommendedFirmwareVersion]: [ProductType.Enterprise],
  [AlertClassName.NvdimmMemoryModLifetimeCritical]: [ProductType.Enterprise],
  [AlertClassName.NvdimmMemoryModLifetimeWarning]: [ProductType.Enterprise],
  [AlertClassName.OldBiosVersion]: [ProductType.Enterprise],
  [AlertClassName.PowerSupply]: [ProductType.Enterprise],
  [AlertClassName.SataDomWearCritical]: [ProductType.Enterprise],
  [AlertClassName.SataDomWearWarning]: [ProductType.Enterprise],
  [AlertClassName.Sensor]: [ProductType.Enterprise],
  [AlertClassName.Nvdimm]: [ProductType.Enterprise],
  [AlertClassName.MemoryErrors]: [ProductType.Enterprise],

  // System (Enterprise-only)
  [AlertClassName.ProactiveSupport]: [ProductType.Enterprise],
  [AlertClassName.LicenseHasExpired]: [ProductType.Enterprise],
  [AlertClassName.LicenseIsExpiring]: [ProductType.Enterprise],
  [AlertClassName.License]: [ProductType.Enterprise],
};

const allProductTypes = [ProductType.CommunityEdition, ProductType.Enterprise];

export function getAlertClassProductTypes(alertClass: AlertClassName): ProductType[] {
  return restrictedAlertClasses[alertClass] ?? allProductTypes;
}
