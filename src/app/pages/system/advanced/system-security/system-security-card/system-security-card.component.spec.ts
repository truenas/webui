import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SystemSecurityCardComponent } from 'app/pages/system/advanced/system-security/system-security-card/system-security-card.component';
import { SystemSecurityFormComponent } from 'app/pages/system/advanced/system-security/system-security-form/system-security-form.component';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

const fakeSystemSecurityConfig: SystemSecurityConfig = {
  enable_fips: false,
  enable_gpos_stig: false,
};

describe('SystemSecurityCardComponent', () => {
  let spectator: Spectator<SystemSecurityCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SystemSecurityCardComponent,
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectIsHaLicensed, value: true },
        ],
      }),
      mockAuth(),
      mockApi([
        mockCall('system.security.config', fakeSystemSecurityConfig),
      ]),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true, error: null })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows System Security related settings', async () => {
    const items = await loader.getAllHarnesses(MatListItemHarness);
    const itemTexts = await parallel(() => items.map((item) => item.getFullText()));

    expect(itemTexts).toEqual([
      'Enable FIPS: No',
      'Enable General Purpose OS STIG compatibility mode: No',
    ]);
  });

  it('opens System Security form when Settings button is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Settings' }));
    await configureButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      SystemSecurityFormComponent,
      { data: fakeSystemSecurityConfig },
    );
  });
});
