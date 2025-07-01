import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { TncStatus, TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
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
    expect(spectator.query('[ixTest="tnc-status-reason"]')).toHaveText('Power Up your TrueNAS Experience! Link your system with TrueNAS Connect now for additional security, alerting, and other features.');
  });

  it('should display failed state correctly', () => {
    spectator.setInput('status', TncStatus.Failed);
    spectator.detectChanges();

    expect(spectator.query('.status-failed')).toBeTruthy();
    expect(spectator.query('[ixTest="tnc-status"]')).toHaveText('Connection Failed...');
    expect(spectator.query('[ixTest="tnc-status-reason"]')).toHaveText('Something went wrong! Please check your network connectivity and then click Retry Connection to get started.');
  });

  it('should display active state correctly', () => {
    spectator.setInput('status', TncStatus.Active);
    spectator.detectChanges();

    expect(spectator.query('.status-connected')).toBeTruthy();
    expect(spectator.query('[ixTest="tnc-status"]')).toHaveText('TrueNAS Connect - Status Healthy');
    expect(spectator.query('[ixTest="tnc-status-reason"]')).toHaveText('Your system is linked with TrueNAS Connect. Click below to open the TrueNAS Connect Management Interface');
  });

  it('should display connecting state correctly', () => {
    spectator.setInput('status', TncStatus.Connecting);
    spectator.detectChanges();

    expect(spectator.query('.connecting-state-content')).toBeTruthy();
    expect(spectator.query('ix-truenas-connect-spinner')).toBeTruthy();
    expect(spectator.query('[ixTest="tnc-status"]')).toHaveText('Setting up TrueNAS Connect');
    expect(spectator.query('[ixTest="tnc-status-reason"]')).toHaveText('Your system is setting up with TrueNAS Connect, this may take a few moments.');
  });

  it('should display disabled state correctly', () => {
    spectator.setInput('status', TncStatus.Disabled);
    spectator.setInput('rawStatus', TruenasConnectStatus.Disabled);
    spectator.detectChanges();

    expect(spectator.query('.status-disabled')).toBeTruthy();
    expect(spectator.query('[ixTest="tnc-status"]')).toHaveText('DISABLED');
  });
});
