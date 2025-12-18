import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { FcMpioInfoBannerComponent } from './fc-mpio-info-banner.component';

describe('FcMpioInfoBannerComponent', () => {
  let spectator: Spectator<FcMpioInfoBannerComponent>;
  const createComponent = createComponentFactory({
    component: FcMpioInfoBannerComponent,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('displays the MPIO information banner', () => {
    expect(spectator.query('.mpio-info-banner')).toExist();
  });

  it('displays the information icon', () => {
    const icon = spectator.query('ix-icon');
    expect(icon).toExist();
    expect(icon.getAttribute('name')).toBe('mdi-information-outline');
  });

  it('displays the MPIO configuration title', () => {
    expect(spectator.query('.info-header')).toContainText('MPIO Configuration');
  });

  it('displays the information message', () => {
    const message = spectator.query('.info-message');
    expect(message).toContainText('MPIO');
    expect(message).toContainText('unique physical port');
  });
});
