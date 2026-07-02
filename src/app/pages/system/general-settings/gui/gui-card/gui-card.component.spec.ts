import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness } from '@truenas/ui-components';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { GuiCardComponent } from 'app/pages/system/general-settings/gui/gui-card/gui-card.component';
import { GuiFormComponent } from 'app/pages/system/general-settings/gui/gui-form/gui-form.component';
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
              ui_certificate: 1,
              ui_certificate_name: 'truenas_default',
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
        ],
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows GUI related settings', () => {
    const items = spectator.queryAll<HTMLElement>('tn-list-item');
    const itemTexts = items.map((item) => item.textContent!.trim().replace(/\s+/g, ' '));

    expect(itemTexts).toEqual([
      'GUI SSL Certificate: truenas_default',
      'Web Interface IPv4 Address: 0.0.0.0',
      'Web Interface IPv6 Address: 0.0.0.0',
      'Web Interface HTTP Port: 80',
      'Web Interface HTTPS Port: 443',
      'HTTPS Protocols: TLSv1.2, TLSv1.3',
      'Web Interface HTTP -> HTTPS Redirect: Disabled',
      'Usage collection & UI error reporting: Enabled',
      'Show Console Messages: Disabled',
    ]);
  });

  it('opens GUI form when Settings button is pressed', async () => {
    const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Settings' }));
    await configureButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(GuiFormComponent, {
      title: 'GUI Settings',
    });
  });
});
