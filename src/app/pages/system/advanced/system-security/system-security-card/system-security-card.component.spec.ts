import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PasswordComplexityRuleset } from 'app/enums/password-complexity-ruleset.enum';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SystemSecurityCardComponent } from 'app/pages/system/advanced/system-security/system-security-card/system-security-card.component';
import { SystemSecurityFormComponent } from 'app/pages/system/advanced/system-security/system-security-form/system-security-form.component';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

const fakeSystemSecurityConfig: SystemSecurityConfig = {
  enable_fips: false,
  enable_gpos_stig: false,
  min_password_age: 5,
  max_password_age: 30,
  password_complexity_ruleset: {
    $set: [PasswordComplexityRuleset.Upper, PasswordComplexityRuleset.Number],
  },
  min_password_length: 10,
  password_history_length: 5,
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
        open: jest.fn(() => of({ response: true })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows all System Security settings in card', async () => {
    const items = await loader.getAllHarnesses(MatListItemHarness);
    const texts = await parallel(() => items.map((item) => item.getFullText()));

    expect(texts).toEqual([
      'Enable FIPS: No',
      'Enable General Purpose OS STIG compatibility mode: No',
      'Min Password Age: 5 days',
      'Max Password Age: 30 days',
      'Password Complexity Ruleset: Upper, Number',
      'Min Password Length: 10 characters',
      'Password History Length: 5 entries',
    ]);
  });

  it('opens System Security form when Settings button is clicked', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Settings' }));
    await button.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      SystemSecurityFormComponent,
      { data: fakeSystemSecurityConfig },
    );
  });
});
