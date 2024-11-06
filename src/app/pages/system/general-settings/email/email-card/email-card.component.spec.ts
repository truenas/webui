import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { MailSecurity } from 'app/enums/mail-security.enum';
import { MailConfig } from 'app/interfaces/mail-config.interface';
import { EmailCardComponent } from 'app/pages/system/general-settings/email/email-card/email-card.component';
import { EmailFormComponent } from 'app/pages/system/general-settings/email/email-form/email-form.component';
import { SlideInService } from 'app/services/slide-in.service';

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

describe('EmailCardComponent', () => {
  let spectator: Spectator<EmailCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: EmailCardComponent,
    providers: [
      mockWebSocket([
        mockCall('mail.config', fakeEmailConfig),
      ]),
      mockProvider(SlideInService, {
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

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(EmailFormComponent, { data: fakeEmailConfig });
  });
});
