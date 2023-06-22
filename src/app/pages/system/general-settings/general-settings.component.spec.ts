import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { EmailCardComponent } from 'app/pages/system/general-settings/email/email-card/email-card.component';
import { GeneralSettingsComponent } from 'app/pages/system/general-settings/general-settings.component';
import { GuiCardComponent } from 'app/pages/system/general-settings/gui/gui-card/gui-card.component';
import { LocalizationCardComponent } from 'app/pages/system/general-settings/localization/localization-card/localization-card.component';
import { NtpServerCardComponent } from 'app/pages/system/general-settings/ntp-server/ntp-server-card/ntp-server-card.component';
import { SupportCardComponent } from 'app/pages/system/general-settings/support/support-card/support-card.component';

describe('GeneralSettingsComponent', () => {
  let spectator: Spectator<GeneralSettingsComponent>;
  const createComponent = createComponentFactory({
    component: GeneralSettingsComponent,
    declarations: [
      MockComponents(
        SupportCardComponent,
        GuiCardComponent,
        LocalizationCardComponent,
        NtpServerCardComponent,
        EmailCardComponent,
      ),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows cards with general settings', () => {
    expect(spectator.query(SupportCardComponent)).toExist();
    expect(spectator.query(GuiCardComponent)).toExist();
    expect(spectator.query(LocalizationCardComponent)).toExist();
    expect(spectator.query(NtpServerCardComponent)).toExist();
    expect(spectator.query(EmailCardComponent)).toExist();
  });
});
