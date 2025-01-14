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
  [TruenasConnectStatus.Disabled]: 'TrueNAS Connect is disabled',
  [TruenasConnectStatus.ClaimTokenMissing]: 'Waiting for claim token to be generated',
  [TruenasConnectStatus.RegistrationFinalizationWaiting]: 'Waiting for registration with TrueNAS Connect to complete',
  [TruenasConnectStatus.RegistrationFinalizationFailed]: 'Registration finalization failed',
  [TruenasConnectStatus.RegistrationFinalizationTimeout]: 'Registration finalization timed out',
  [TruenasConnectStatus.RegistrationFinalizationSuccess]: 'Registration finalization successful',
  [TruenasConnectStatus.CertGenerationInProgress]: 'Certificate generation is in progress',
  [TruenasConnectStatus.CertGenerationFailed]: 'Certificate generation failed',
  [TruenasConnectStatus.CertGenerationSuccess]: 'Certificate generation was successful',
  [TruenasConnectStatus.CertConfigurationFailure]: 'Failed to configure certificate in system UI',
  [TruenasConnectStatus.CertRenewalInProgress]: 'Certificate renewal is in progress',
  [TruenasConnectStatus.CertRenewalFailure]: 'Failed to renew certificate',
  [TruenasConnectStatus.CertRenewalSuccess]: 'Certificate renewal was successful',
  [TruenasConnectStatus.Configured]: 'TrueNAS Connect is configured',
};
