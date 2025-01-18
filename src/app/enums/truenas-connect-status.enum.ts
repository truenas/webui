import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum TruenasConnectStatus {
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
export const TruenasConnectStatusReason: Record<TruenasConnectStatus, string> = {
  [TruenasConnectStatus.Disabled]: T('TrueNAS Connect is disabled'),
  [TruenasConnectStatus.ClaimTokenMissing]: T('Waiting for claim token to be generated'),
  [TruenasConnectStatus.RegistrationFinalizationWaiting]: T('Waiting for registration with TrueNAS Connect to complete'),
  [TruenasConnectStatus.RegistrationFinalizationFailed]: T('Registration finalization failed'),
  [TruenasConnectStatus.RegistrationFinalizationTimeout]: T('Registration finalization timed out'),
  [TruenasConnectStatus.RegistrationFinalizationSuccess]: T('Registration finalization successful'),
  [TruenasConnectStatus.CertGenerationInProgress]: T('Certificate generation is in progress'),
  [TruenasConnectStatus.CertGenerationFailed]: T('Certificate generation failed'),
  [TruenasConnectStatus.CertGenerationSuccess]: T('Certificate generation was successful'),
  [TruenasConnectStatus.CertConfigurationFailure]: T('Failed to configure certificate in system UI'),
  [TruenasConnectStatus.CertRenewalInProgress]: T('Certificate renewal is in progress'),
  [TruenasConnectStatus.CertRenewalFailure]: T('Failed to renew certificate'),
  [TruenasConnectStatus.CertRenewalSuccess]: T('Certificate renewal was successful'),
  [TruenasConnectStatus.Configured]: T('TrueNAS Connect is configured'),
};
