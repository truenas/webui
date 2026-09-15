/**
 * Hardware class reported by `truenas.entitlements.facts`.
 *
 * `Truenas` is TrueNAS appliance hardware only. A TrueNAS Mini is iX hardware but reports `Community`.
 */
export enum HardwareType {
  Truenas = 'TRUENAS',
  Community = 'COMMUNITY',
}
