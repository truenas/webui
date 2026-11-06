import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { TncStatus, TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { TruenasConnectTier } from 'app/enums/truenas-connect-tier.enum';
import { tierDisplayConfig } from 'app/modules/truenas-connect/truenas-connect-tier.utils';
import { TruenasConnectStatusDisplayComponent } from './truenas-connect-status-display.component';

describe('TruenasConnectStatusDisplayComponent', () => {
  let spectator: Spectator<TruenasConnectStatusDisplayComponent>;

  const createComponent = createComponentFactory({
    component: TruenasConnectStatusDisplayComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        status: TncStatus.Active,
        rawStatus: TruenasConnectStatus.Configured,
      },
    });
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should display waiting state correctly', () => {
    spectator.setInput('status', TncStatus.Waiting);
    spectator.detectChanges();

    expect(spectator.query('.waiting-state-content')).toBeTruthy();
    expect(spectator.query('.waiting-state-text')).toHaveText('Power Up your TrueNAS Experience! Link your system with TrueNAS Connect now for additional security, alerting, and other features.');
  });

  it('should display failed state correctly', () => {
    spectator.setInput('status', TncStatus.Failed);
    spectator.setInput('rawStatus', TruenasConnectStatus.RegistrationFinalizationFailed);
    spectator.detectChanges();

    expect(spectator.query('.status-failed')).toBeTruthy();
    expect(spectator.query('.failed-header')).toHaveText('Connection Failed...');
    expect(spectator.query('.failed-description')).toHaveText('Something went wrong! Please check your network connectivity and then click Retry Connection to get started.');
  });

  it('replaces the network hint with the middleware failure detail when registration fails', () => {
    spectator.setInput('status', TncStatus.Failed);
    spectator.setInput('rawStatus', TruenasConnectStatus.RegistrationFinalizationFailed);
    spectator.setInput('statusReason', 'System limit exceeded');
    spectator.detectChanges();

    expect(spectator.query('.failed-description')).toHaveExactTrimmedText(
      'TrueNAS Connect could not complete the registration. Resolve the issue below, then click Retry Connection.',
    );
    expect(spectator.query('.failure-detail')).toHaveExactTrimmedText('Details: System limit exceeded');
  });

  it('hides the failure detail while status_reason is the generic per-status text', () => {
    spectator.setInput('status', TncStatus.Failed);
    spectator.setInput('rawStatus', TruenasConnectStatus.RegistrationFinalizationFailed);
    spectator.setInput('statusReason', 'Registration finalization failed');
    spectator.detectChanges();

    expect(spectator.query('.failure-detail')).not.toExist();
  });

  it('does not show status_reason as a failure detail for other failed statuses', () => {
    spectator.setInput('status', TncStatus.Failed);
    spectator.setInput('rawStatus', TruenasConnectStatus.CertGenerationFailed);
    spectator.setInput('statusReason', 'Certificate generation failed');
    spectator.detectChanges();

    expect(spectator.query('.failure-detail')).not.toExist();
  });

  it('shows a timeout-specific message when the user did not finish authorization in time', () => {
    spectator.setInput('status', TncStatus.Failed);
    spectator.setInput('rawStatus', TruenasConnectStatus.RegistrationFinalizationTimeout);
    spectator.detectChanges();

    expect(spectator.query('.failed-description')).toHaveText(
      "Registration wasn't completed in time. Click Retry Connection and finish authorization in the TrueNAS Connect window.",
    );
  });

  it('should display active state correctly', () => {
    spectator.setInput('status', TncStatus.Active);
    spectator.detectChanges();

    expect(spectator.query('.status-connected')).toBeTruthy();
    expect(spectator.query('.active-header')).toHaveText('TrueNAS Connect - Status Healthy');
    expect(spectator.query('.active-description')).toHaveText('Your system is linked with TrueNAS Connect. Click below to open the TrueNAS Connect Management Interface');
  });

  it('should display connecting state correctly', () => {
    spectator.setInput('status', TncStatus.Connecting);
    spectator.detectChanges();

    expect(spectator.query('.connecting-state-content')).toBeTruthy();
    expect(spectator.query('ix-truenas-connect-spinner')).toBeTruthy();
    expect(spectator.query('.connecting-header')).toHaveText('Setting up TrueNAS Connect');
    expect(spectator.query('.connecting-description')).toHaveText('Your system is setting up with TrueNAS Connect; this may take a few moments.');
  });

  it('should display disabled state correctly', () => {
    spectator.setInput('status', TncStatus.Disabled);
    spectator.setInput('rawStatus', TruenasConnectStatus.Disabled);
    spectator.detectChanges();

    expect(spectator.query('.status-disabled')).toBeTruthy();
    expect(spectator.query('.status-header > span')).toHaveText('DISABLED');
  });

  it('should not show tier badge when tier is null', () => {
    spectator.setInput('status', TncStatus.Active);
    spectator.setInput('tier', null);
    spectator.detectChanges();

    expect(spectator.query('.tier-badge')).not.toExist();
  });

  it('should show Foundation tier badge when tier is FOUNDATION', () => {
    spectator.setInput('status', TncStatus.Active);
    spectator.setInput('tier', TruenasConnectTier.Foundation);
    spectator.detectChanges();

    const badge = spectator.query<HTMLElement>('.tier-badge');
    expect(badge).toExist();
    expect(badge?.style.background).toBe(tierDisplayConfig[TruenasConnectTier.Foundation].background);
    expect(badge).toContainText('Tier: Foundation');
  });

  it('should show Plus tier badge when tier is PLUS', () => {
    spectator.setInput('status', TncStatus.Active);
    spectator.setInput('tier', TruenasConnectTier.Plus);
    spectator.detectChanges();

    const badge = spectator.query<HTMLElement>('.tier-badge');
    expect(badge).toExist();
    expect(badge?.style.background).toBe(tierDisplayConfig[TruenasConnectTier.Plus].background);
    expect(badge).toContainText('Tier: Plus');
  });

  it('should show Business tier badge when tier is BUSINESS', () => {
    spectator.setInput('status', TncStatus.Active);
    spectator.setInput('tier', TruenasConnectTier.Business);
    spectator.detectChanges();

    const badge = spectator.query<HTMLElement>('.tier-badge');
    expect(badge).toExist();
    expect(badge?.style.background).toBe(tierDisplayConfig[TruenasConnectTier.Business].background);
    expect(badge).toContainText('Tier: Business');
  });
});
