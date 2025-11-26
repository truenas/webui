import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { TncStatus, HarborosConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { HarborosConnectStatusDisplayComponent } from './truenas-connect-status-display.component';

describe('HarborosConnectStatusDisplayComponent', () => {
  let spectator: Spectator<HarborosConnectStatusDisplayComponent>;

  const createComponent = createComponentFactory({
    component: HarborosConnectStatusDisplayComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        status: TncStatus.Active,
        rawStatus: HarborosConnectStatus.Configured,
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
    expect(spectator.query('[ixTest="tnc-status-reason"]')).toHaveText('Power Up your HarborOS Experience! Link your system with HarborOS Connect now for additional security, alerting, and other features.');
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
    expect(spectator.query('[ixTest="tnc-status"]')).toHaveText('HarborOS Connect - Status Healthy');
    expect(spectator.query('[ixTest="tnc-status-reason"]')).toHaveText('Your system is linked with HarborOS Connect. Click below to open the HarborOS Connect Management Interface');
  });

  it('should display connecting state correctly', () => {
    spectator.setInput('status', TncStatus.Connecting);
    spectator.detectChanges();

    expect(spectator.query('.connecting-state-content')).toBeTruthy();
    expect(spectator.query('ix-truenas-connect-spinner')).toBeTruthy();
    expect(spectator.query('[ixTest="tnc-status"]')).toHaveText('Setting up HarborOS Connect');
    expect(spectator.query('[ixTest="tnc-status-reason"]')).toHaveText('Your system is setting up with HarborOS Connect, this may take a few moments.');
  });

  it('should display disabled state correctly', () => {
    spectator.setInput('status', TncStatus.Disabled);
    spectator.setInput('rawStatus', HarborosConnectStatus.Disabled);
    spectator.detectChanges();

    expect(spectator.query('.status-disabled')).toBeTruthy();
    expect(spectator.query('[ixTest="tnc-status"]')).toHaveText('DISABLED');
  });
});
