import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { SystemSecurityCardComponent } from 'app/pages/system/advanced/system-security/system-security-card/system-security-card.component';
import { SystemSecurityFormComponent } from 'app/pages/system/advanced/system-security/system-security-form/system-security-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

const fakeSystemSecurityConfig: SystemSecurityConfig = {
  enable_fips: false,
};

describe('SystemSecurityCardComponent', () => {
  let spectator: Spectator<SystemSecurityCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SystemSecurityCardComponent,
    providers: [
      mockWebsocket([
        mockCall('system.security.config', fakeSystemSecurityConfig),
      ]),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => ({ slideInClosed$: of() })),
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
    ]);
  });

  it('opens System Security form when Settings button is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Settings' }));
    await configureButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(
      SystemSecurityFormComponent,
      {
        data: fakeSystemSecurityConfig,
      },
    );
  });
});
