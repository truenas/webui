import { NgTemplateOutlet } from '@angular/common';
import { createHostFactory, SpectatorHost, mockProvider } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { IsHaDirective } from './is-ha.directive';

describe('IsHaDirective', () => {
  let spectator: SpectatorHost<unknown>;

  const createDirective = createHostFactory({
    component: IsHaDirective,
    imports: [NgTemplateOutlet],
    providers: [
      mockProvider(Store, {
        select: jest.fn(),
      }),
    ],
  });

  it('renders content when selectIsHaLicensed is true and directive input is true', () => {
    spectator = createDirective('<ng-container *isHa="true"><div id="ha-content">HA Enabled</div></ng-container>', {
      providers: [
        mockProvider(Store, {
          select: () => of(true),
        }),
      ],
    });

    expect(spectator.query('#ha-content')).toBeTruthy();
  });

  it('does not render content when selectIsHaLicensed is false and directive input is true', () => {
    spectator = createDirective('<ng-container *isHa="true"><div id="ha-content">HA Enabled</div></ng-container>', {
      providers: [
        mockProvider(Store, {
          select: () => of(false),
        }),
      ],
    });

    expect(spectator.query('#ha-content')).toBeNull();
  });

  it('renders content when selectIsHaLicensed is false and directive input is false', () => {
    spectator = createDirective('<ng-container *isHa="false"><div id="not-ha-content">HA Disabled</div></ng-container>', {
      providers: [
        mockProvider(Store, {
          select: () => of(false),
        }),
      ],
    });

    expect(spectator.query('#not-ha-content')).toBeTruthy();
  });

  it('does not render content when selectIsHaLicensed is true and directive input is false', () => {
    spectator = createDirective('<ng-container *isHa="false"><div id="not-ha-content">HA Disabled</div></ng-container>', {
      providers: [
        mockProvider(Store, {
          select: () => of(true),
        }),
      ],
    });

    expect(spectator.query('#not-ha-content')).toBeNull();
  });
});
