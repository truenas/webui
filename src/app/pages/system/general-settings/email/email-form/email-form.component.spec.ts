import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { MailSecurity } from 'app/enums/mail-security.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { MailConfig, MailOauthConfig } from 'app/interfaces/mail-config.interface';
import { OauthMessage } from 'app/interfaces/oauth-message.interface';
import { User } from 'app/interfaces/user.interface';
import { OauthButtonComponent } from 'app/modules/buttons/oauth-button/oauth-button.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';
import { EmailFormComponent } from './email-form.component';

const fakeEmailConfig: MailConfig = {
  id: 1,
  fromemail: 'from@ixsystems.com',
  fromname: 'John Smith',
  oauth: {},
  outgoingserver: 'smtp.gmail.com',
  pass: '12345678',
  port: 587,
  security: MailSecurity.Tls,
  smtp: true,
  user: 'authuser@ixsystems.com',
};

describe('EmailFormComponent', () => {
  let spectator: Spectator<EmailFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let api: ApiService;

  const slideInRef: SlideInRef<MailConfig | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => fakeEmailConfig),
  };

  const createComponent = createComponentFactory({
    component: EmailFormComponent,
    imports: [
      ReactiveFormsModule,
      OauthButtonComponent,
    ],
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectSystemInfo, value: { hostname: 'host.truenas.com' } },
        ],
      }),
      mockApi([
        mockCall('mail.local_administrator_email', 'authuser@ixsystems.com'),
        mockCall('mail.update'),
        mockCall('user.query', [
          { email: 'root@truenas.com' },
        ] as User[]),
        mockJob('mail.send'),
      ]),
      mockProvider(DialogService, {
        jobDialog: () => ({
          afterClosed: () => of(null),
        }),
      }),
      mockProvider(SnackbarService),
      mockProvider(SystemGeneralService, {
        getProductType: () => ProductType.CommunityEdition,
      }),
      mockWindow({
        open: jest.fn(),
        location: {
          toString: () => 'http://truenas.com/system/email',
        } as Location,
        addEventListener: jest.fn((_, listener: EventListener) => {
          listener({
            data: {
              oauth_portal: true,
              result: {
                refresh_token: 'new_token',
                client_secret: 'new_secret',
                client_id: 'new_client_id',
              },
            },
          } as OauthMessage<MailOauthConfig>);
        }),
        removeEventListener: jest.fn(),
      }),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  describe('form checks', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
    });

    it('checks if root email is set when Send Test Mail is pressed and shows a warning if it\'s not', async () => {
      spectator.inject(MockApiService).mockCall('mail.local_administrator_email', null);

      const button = await loader.getHarness(MatButtonHarness.with({ text: 'Send Test Mail' }));
      await button.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('mail.local_administrator_email');
      expect(spectator.inject(DialogService).info).toHaveBeenCalledWith(
        'Email',
        'No e-mail address is set for root user or any other local administrator. Please, configure such an email address first.',
      );
    });

    it('opens new window with OAuth page when user presses Log In To Gmail', async () => {
      await form.fillForm({
        'Send Mail Method': 'GMail OAuth',
      });

      const logInButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Gmail' }));
      await logInButton.click();

      const window = spectator.inject<Window>(WINDOW);
      expect(window.open).toHaveBeenCalledWith(
        'https://truenas.com/oauth/gmail?origin=http%3A%2F%2Ftruenas.com%2Fsystem%2Femail',
        '_blank',
        'width=640,height=480',
      );
      expect(window.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
        false,
      );
    });

    it('calls removeEventListener when gmail oAuth callback is called', async () => {
      await form.fillForm({
        'Send Mail Method': 'GMail OAuth',
      });

      const loginButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Gmail' }));
      await loginButton.click();

      expect(spectator.inject<Window>(WINDOW).removeEventListener)
        .toHaveBeenCalledWith('message', expect.any(Function), false);
    });

    it('saves Gmail Oauth config when user authorizes via Gmail and saves the form', async () => {
      await form.fillForm({
        'From Email': 'newfrom@ixsystems.com',
        'From Name': 'Johnny',
        'Send Mail Method': 'GMail OAuth',
      });

      const logInButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Gmail' }));
      await logInButton.click();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('mail.update', [{
        fromemail: 'newfrom@ixsystems.com',
        fromname: 'Johnny',
        oauth: {
          client_id: 'new_client_id',
          client_secret: 'new_secret',
          refresh_token: 'new_token',
          provider: 'gmail',
        },
      }]);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
        'Email settings updated.',
      );
    });

    it('sends test email with Gmail Oauth config when Gmail used and Send Test Mail is pressed', async () => {
      await form.fillForm({
        'Send Mail Method': 'GMail OAuth',
      });

      const logInButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Gmail' }));
      await logInButton.click();

      const sendTestEmailButton = await loader.getHarness(MatButtonHarness.with({ text: 'Send Test Mail' }));
      await sendTestEmailButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
        'mail.send',
        [
          {
            subject: 'Test Message',
            text: 'This is a test message from TrueNAS COMMUNITY EDITION.',
          },
          {
            fromemail: 'from@ixsystems.com',
            fromname: 'John Smith',
            oauth: {
              client_id: 'new_client_id',
              client_secret: 'new_secret',
              refresh_token: 'new_token',
              provider: 'gmail',
            },
          },
        ],
      );
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
        'Test email sent.',
      );
    });

    it('opens new window with OAuth page when user presses Log In To Outlook', async () => {
      await form.fillForm({
        'Send Mail Method': 'Outlook OAuth',
      });

      const logInButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Outlook' }));
      await logInButton.click();

      const window = spectator.inject<Window>(WINDOW);
      expect(window.open).toHaveBeenCalledWith(
        'https://www.truenas.com/oauth/outlook?origin=http%3A%2F%2Ftruenas.com%2Fsystem%2Femail',
        '_blank',
        'width=640,height=480',
      );
      expect(window.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
        false,
      );
    });

    it('disables Save button when no From Email is provided for Outlook OAuth', async () => {
      await form.fillForm({
        'Send Mail Method': 'Outlook OAuth',
        'From Email': '',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
    });

    it('calls removeEventListener when outlook oAuth callback is called', async () => {
      await form.fillForm({
        'Send Mail Method': 'Outlook OAuth',
      });

      const loginButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Outlook' }));
      await loginButton.click();

      expect(spectator.inject<Window>(WINDOW).removeEventListener)
        .toHaveBeenCalledWith('message', expect.any(Function), false);
    });

    it('saves Outlook Oauth config when user authorizes via Outlook and saves the form', async () => {
      await form.fillForm({
        'From Email': 'newfrom@ixsystems.com',
        'From Name': 'Johnny',
        'Send Mail Method': 'Outlook OAuth',
      });

      const logInButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Outlook' }));
      await logInButton.click();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('mail.update', [{
        fromemail: 'newfrom@ixsystems.com',
        fromname: 'Johnny',
        outgoingserver: 'smtp-mail.outlook.com',
        port: 587,
        security: 'TLS',
        oauth: {
          client_id: 'new_client_id',
          client_secret: 'new_secret',
          refresh_token: 'new_token',
          provider: 'outlook',
        },
      }]);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
        'Email settings updated.',
      );
    });

    it('sends test email with Outlook Oauth config when Outlook used and Send Test Mail is pressed', async () => {
      await form.fillForm({
        'Send Mail Method': 'Outlook OAuth',
      });

      const logInButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Outlook' }));
      await logInButton.click();

      const sendTestEmailButton = await loader.getHarness(MatButtonHarness.with({ text: 'Send Test Mail' }));
      await sendTestEmailButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
        'mail.send',
        [
          {
            subject: 'Test Message',
            text: 'This is a test message from TrueNAS COMMUNITY EDITION.',
          },
          {
            fromemail: 'from@ixsystems.com',
            fromname: 'John Smith',
            outgoingserver: 'smtp-mail.outlook.com',
            port: 587,
            security: 'TLS',
            oauth: {
              client_id: 'new_client_id',
              client_secret: 'new_secret',
              refresh_token: 'new_token',
              provider: 'outlook',
            },
          },
        ],
      );
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
        'Test email sent.',
      );
    });
  });

  describe('SMTP config', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
    });

    it('saves SMTP config when form is filled and Save is pressed', async () => {
      await form.fillForm({
        'From Email': 'newfrom@ixsystems.com',
        'From Name': 'Jeremy',
        'Outgoing Mail Server': 'smtp.ixsystems.com',
        'Mail Server Port': '21',
        Security: 'SSL (Implicit TLS)',
        'SMTP Authentication': false,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('mail.update', [{
        fromemail: 'newfrom@ixsystems.com',
        fromname: 'Jeremy',
        oauth: null,
        outgoingserver: 'smtp.ixsystems.com',
        port: 21,
        security: MailSecurity.Ssl,
        smtp: false,
      }]);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
        'Email settings updated.',
      );
    });

    it('loads and shows current SMTP config when SMTP is selected', async () => {
      const values = await form.getValues();

      expect(values).toEqual({
        'Send Mail Method': 'SMTP',
        'From Email': 'from@ixsystems.com',
        'From Name': 'John Smith',
        'Outgoing Mail Server': 'smtp.gmail.com',
        'Mail Server Port': '587',
        Security: 'TLS (STARTTLS)',
        'SMTP Authentication': true,
        Password: '12345678',
        Username: 'authuser@ixsystems.com',
      });
    });

    it('sends test email with SMTP settings when SMTP form is used and Send Test Mail is pressed', async () => {
      const sendTestEmailButton = await loader.getHarness(MatButtonHarness.with({ text: 'Send Test Mail' }));
      await sendTestEmailButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
        'mail.send',
        [
          {
            subject: 'Test Message',
            text: 'This is a test message from TrueNAS COMMUNITY EDITION.',
          },
          {
            fromemail: 'from@ixsystems.com',
            fromname: 'John Smith',
            oauth: null,
            outgoingserver: 'smtp.gmail.com',
            pass: '12345678',
            port: 587,
            security: MailSecurity.Tls,
            smtp: true,
            user: 'authuser@ixsystems.com',
          },
        ],
      );
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
        'Test email sent.',
      );
    });
  });

  describe('Gmail OAuth', () => {
    const fakeGmailEmailConfig = {
      ...fakeEmailConfig,
      oauth: {
        client_id: 'client_id',
        client_secret: 'secret',
        refresh_token: 'token',
        provider: 'gmail',
      },
    };

    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => fakeGmailEmailConfig }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
    });

    it('shows current Gmail config when Gmail is set', async () => {
      const values = await form.getValues();

      expect(values).toEqual({
        'From Email': 'from@ixsystems.com',
        'From Name': 'John Smith',
        'Send Mail Method': 'GMail OAuth',
      });
      expect(spectator.query('.oauth-message')).toHaveText('Gmail credentials have been applied.');
    });
  });

  describe('Outlook OAuth', () => {
    const fakeOutlookEmailConfig = {
      ...fakeEmailConfig,
      oauth: {
        client_id: 'client_id',
        client_secret: 'secret',
        refresh_token: 'token',
        provider: 'outlook',
      },
    };

    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => fakeOutlookEmailConfig }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
    });

    it('shows current Outlook config when Outlook is set', async () => {
      const values = await form.getValues();

      expect(values).toEqual({
        'From Email': 'from@ixsystems.com',
        'From Name': 'John Smith',
        'Send Mail Method': 'Outlook OAuth',
      });
      expect(spectator.query('.oauth-message')).toHaveText('Outlook credentials have been applied.');
    });
  });
});
