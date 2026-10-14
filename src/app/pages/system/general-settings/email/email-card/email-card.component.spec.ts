import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { CallResponse } from '@truenas/api-client';
import { TnButtonHarness } from '@truenas/ui-components';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { MailSecurity } from 'app/enums/mail-security.enum';
import { MailConfig, MailOauthConfig } from 'app/interfaces/mail-config.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { EmailCardComponent } from 'app/pages/system/general-settings/email/email-card/email-card.component';
import { EmailFormComponent } from 'app/pages/system/general-settings/email/email-form/email-form.component';

const fakeEmailConfig: MailConfig = {
  id: 1,
  fromemail: 'root@truenas.local',
  outgoingserver: 'google.com',
  port: 25,
  security: MailSecurity.Plain,
  smtp: false,
  pass: '',
  fromname: 'Test',
  oauth: {},
  user: null as string,
};

describe('EmailCardComponent with SMTP', () => {
  let spectator: Spectator<EmailCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: EmailCardComponent,
    providers: [
      mockTypedApi([
        mockTypedCall('mail.config', fakeEmailConfig as unknown as CallResponse<WebUiApiDirectory, 'mail.config'>),
      ]),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows Email related settings', () => {
    const items = spectator.queryAll<HTMLElement>('tn-list-item');
    const itemTexts = items.map((item) => item.textContent!.trim().replace(/\s+/g, ' '));

    expect(itemTexts).toEqual([
      'Send Mail Method: SMTP',
      'From: Test root@truenas.local via google.com',
    ]);
  });

  it('opens Email form when Settings button is pressed', async () => {
    const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Settings' }));
    await configureButton.click();

    expect(spectator.inject(FormSidePanelService).open)
      .toHaveBeenCalledWith(EmailFormComponent, { title: 'Email Options', inputs: { config: fakeEmailConfig } });
  });
});

describe('EmailCardComponent with Gmail OAuth', () => {
  let spectator: Spectator<EmailCardComponent>;
  const createComponent = createComponentFactory({
    component: EmailCardComponent,
    providers: [
      mockTypedApi([
        mockTypedCall('mail.config', {
          ...fakeEmailConfig,
          oauth: { client_id: '123', provider: 'gmail' } as MailOauthConfig,
        } as unknown as CallResponse<WebUiApiDirectory, 'mail.config'>),
      ]),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();
  });

  it('shows Email related settings', () => {
    const items = spectator.queryAll<HTMLElement>('tn-list-item');
    const itemTexts = items.map((item) => item.textContent!.trim().replace(/\s+/g, ' '));

    expect(itemTexts).toEqual([
      'Send Mail Method: GMail OAuth',
      'From: Test root@truenas.local',
    ]);
  });
});

describe('EmailCardComponent with Outlook OAuth', () => {
  let spectator: Spectator<EmailCardComponent>;
  const createComponent = createComponentFactory({
    component: EmailCardComponent,
    providers: [
      mockTypedApi([
        mockTypedCall('mail.config', {
          ...fakeEmailConfig,
          oauth: { client_id: '123', provider: 'outlook' } as MailOauthConfig,
        } as unknown as CallResponse<WebUiApiDirectory, 'mail.config'>),
      ]),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();
  });

  it('shows Email related settings', () => {
    const items = spectator.queryAll<HTMLElement>('tn-list-item');
    const itemTexts = items.map((item) => item.textContent!.trim().replace(/\s+/g, ' '));

    expect(itemTexts).toEqual([
      'Send Mail Method: Outlook OAuth',
      'From: Test root@truenas.local',
    ]);
  });
});
