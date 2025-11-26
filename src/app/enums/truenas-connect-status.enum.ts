import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum HarborosConnectStatus {
  Disabled = 'DISABLED',
  ClaimTokenMissing = 'CLAIM_TOKEN_MISSING',
  RegistrationFinalizationWaiting = 'REGISTRATION_FINALIZATION_WAITING',
  RegistrationFinalizationFailed = 'REGISTRATION_FINALIZATION_FAILED',
  RegistrationFinalizationTimeout = 'REGISTRATION_FINALIZATION_TIMEOUT',
  RegistrationFinalizationSuccess = 'REGISTRATION_FINALIZATION_SUCCESS',
  CertGenerationInProgress = 'CERT_GENERATION_IN_PROGRESS',
  CertGenerationFailed = 'CERT_GENERATION_FAILED',
  CertGenerationSuccess = 'CERT_GENERATION_SUCCESS',
  CertConfigurationFailure = 'CERT_CONFIGURATION_FAILURE',
  CertRenewalInProgress = 'CERT_RENEWAL_IN_PROGRESS',
  CertRenewalFailure = 'CERT_RENEWAL_FAILURE',
  CertRenewalSuccess = 'CERT_RENEWAL_SUCCESS',
  Configured = 'CONFIGURED',
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const TncStatus = {
  Disabled: T('DISABLED'),
  Waiting: T('WAITING'),
  Connecting: T('CONNECTING'),
  Active: T('ACTIVE'),
  Failed: T('FAILED'),
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const HarborosConnectStatusReason: Record<HarborosConnectStatus, string> = {
  [HarborosConnectStatus.Disabled]: T('HarborOS Connect is disabled'),
  [HarborosConnectStatus.ClaimTokenMissing]: T('Waiting for claim token to be generated'),
  [HarborosConnectStatus.RegistrationFinalizationWaiting]: T('Waiting for registration with HarborOS Connect to complete'),
  [HarborosConnectStatus.RegistrationFinalizationFailed]: T('Registration finalization failed'),
  [HarborosConnectStatus.RegistrationFinalizationTimeout]: T('Registration finalization timed out'),
  [HarborosConnectStatus.RegistrationFinalizationSuccess]: T('Registration finalization successful'),
  [HarborosConnectStatus.CertGenerationInProgress]: T('Certificate generation is in progress'),
  [HarborosConnectStatus.CertGenerationFailed]: T('Certificate generation failed'),
  [HarborosConnectStatus.CertGenerationSuccess]: T('Certificate generation was successful'),
  [HarborosConnectStatus.CertConfigurationFailure]: T('Failed to configure certificate in system UI'),
  [HarborosConnectStatus.CertRenewalInProgress]: T('Certificate renewal is in progress'),
  [HarborosConnectStatus.CertRenewalFailure]: T('Failed to renew certificate'),
  [HarborosConnectStatus.CertRenewalSuccess]: T('Certificate renewal was successful'),
  [HarborosConnectStatus.Configured]: T('HarborOS Connect is active'),
};
