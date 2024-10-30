import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { GuiCardComponent } from 'app/pages/system/general-settings/gui/gui-card/gui-card.component';
import { GuiFormComponent } from 'app/pages/system/general-settings/gui/gui-form/gui-form.component';
import { SlideInService } from 'app/services/slide-in.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';

describe('GuiCardComponent', () => {
  let spectator: Spectator<GuiCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: GuiCardComponent,
    providers: [
      mockAuth(),
      provideMockStore({
        selectors: [
          {
            selector: selectGeneralConfig,
            value: {
              ui_certificate: {
                name: 'truenas_default',
              },
              ui_address: ['0.0.0.0'],
              ui_v6address: ['0.0.0.0'],
              ui_port: 80,
              ui_httpsport: 443,
              ui_httpsprotocols: ['TLSv1.2', 'TLSv1.3'],
              ui_httpsredirect: false,
              usage_collection: true,
              ui_consolemsg: false,
            },
          },
          {
            selector: selectPreferences,
            value: {
              userTheme: 'ix-dark',
            },
          },
        ],
      }),
      mockProvider(SlideInService, {
        open: jest.fn(() => ({ slideInClosed$: of() })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows GUI related settings', async () => {
    const items = await loader.getAllHarnesses(MatListItemHarness);
    const itemTexts = await parallel(() => items.map((item) => item.getFullText()));

    expect(itemTexts).toEqual([
      'Theme: ix-dark',
      'GUI SSL Certificate: truenas_default',
      'Web Interface IPv4 Address: 0.0.0.0',
      'Web Interface IPv6 Address: 0.0.0.0',
      'Web Interface HTTP Port: 80',
      'Web Interface HTTPS Port: 443',
      'HTTPS Protocols: TLSv1.2, TLSv1.3',
      'Web Interface HTTP -> HTTPS Redirect: Disabled',
      'Usage collection: Enabled',
      'Show Console Messages: Disabled',
    ]);
  });

  it('opens GUI form when Settings button is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Settings' }));
    await configureButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(GuiFormComponent);
  });
});
