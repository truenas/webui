import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { MailSecurity } from 'app/enums/mail-security.enum';
import { MailConfig, MailOauthConfig } from 'app/interfaces/mail-config.interface';
import { EmailCardComponent } from 'app/pages/system/general-settings/email/email-card/email-card.component';
import { EmailFormComponent } from 'app/pages/system/general-settings/email/email-form/email-form.component';
import { OldSlideInService } from 'app/services/old-slide-in.service';

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
      mockApi([
        mockCall('mail.config', fakeEmailConfig),
      ]),
      mockProvider(OldSlideInService, {
        open: jest.fn(() => ({ slideInClosed$: of() })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows Email related settings', async () => {
    const items = await loader.getAllHarnesses(MatListItemHarness);
    const itemTexts = await parallel(() => items.map((item) => item.getFullText()));

    expect(itemTexts).toEqual([
      'Send Mail Method: SMTP',
      'From: Test root@truenas.local via google.com',
    ]);
  });

  it('opens Email form when Settings button is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Settings' }));
    await configureButton.click();

    expect(spectator.inject(OldSlideInService).open)
      .toHaveBeenCalledWith(EmailFormComponent, { data: fakeEmailConfig });
  });
});

describe('EmailCardComponent with Gmail OAuth', () => {
  let spectator: Spectator<EmailCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: EmailCardComponent,
    providers: [
      mockApi([
        mockCall('mail.config', {
          ...fakeEmailConfig,
          oauth: { client_id: '123', provider: 'gmail' } as MailOauthConfig,
        }),
      ]),
      mockProvider(OldSlideInService, {
        open: jest.fn(() => ({ slideInClosed$: of() })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows Email related settings', async () => {
    const items = await loader.getAllHarnesses(MatListItemHarness);
    const itemTexts = await parallel(() => items.map((item) => item.getFullText()));

    expect(itemTexts).toEqual([
      'Send Mail Method: GMail OAuth',
    ]);
  });
});

describe('EmailCardComponent with Outlook OAuth', () => {
  let spectator: Spectator<EmailCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: EmailCardComponent,
    providers: [
      mockApi([
        mockCall('mail.config', {
          ...fakeEmailConfig,
          oauth: { client_id: '123', provider: 'outlook' } as MailOauthConfig,
        }),
      ]),
      mockProvider(OldSlideInService, {
        open: jest.fn(() => ({ slideInClosed$: of() })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows Email related settings', async () => {
    const items = await loader.getAllHarnesses(MatListItemHarness);
    const itemTexts = await parallel(() => items.map((item) => item.getFullText()));

    expect(itemTexts).toEqual([
      'Send Mail Method: Outlook OAuth',
    ]);
  });
});
