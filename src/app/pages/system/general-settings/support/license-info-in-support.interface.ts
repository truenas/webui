import { SystemLicense } from 'app/interfaces/system-info.interface';

export interface LicenseInfoInSupport extends SystemLicense {
  featuresString?: string;
  expiration_date?: string;
  add_hardware?: string;
  daysLeftinContract?: number;
}
