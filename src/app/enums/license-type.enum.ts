export enum LicenseType {
  /** Not issued today; reserved in case middleware collapses the HA/single split. */
  Enterprise = 'ENTERPRISE',
  EnterpriseHa = 'ENTERPRISE_HA',
  EnterpriseSingle = 'ENTERPRISE_SINGLE',
  Commercial = 'COMMERCIAL',
  Community = 'COMMUNITY',
  Unknown = 'UNKNOWN',
}
