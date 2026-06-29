import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnCheckboxHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { when } from 'jest-when';
import { of, throwError } from 'rxjs';
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
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
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

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const createComponent = createComponentFactory({
    component: EmailFormComponent,
    imports: [
      ReactiveFormsModule,
      OauthButtonComponent,
    ],
    providers: [
      provideMockStore({
        initialState: {
          systemInfo: {
            systemInfo: { hostname: 'host.truenas.com' },
            productType: ProductType.CommunityEdition,
            isIxHardware: false,
            buildYear: 2024,
          },
        },
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
      ...ixFormTestingProviders(),
      mockAuth(),
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
    ],
  });

  describe('form checks', () => {
    beforeEach(async () => {
      spectator = createComponent({ props: { config: fakeEmailConfig } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
    });

    it('checks if root email is set when Send Test Mail is pressed and shows a warning if it\'s not', async () => {
      spectator.inject(MockApiService).mockCall('mail.local_administrator_email', null);

      const button = await loader.getHarness(TnButtonHarness.with({ label: 'Send Test Mail' }));
      await button.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('mail.local_administrator_email');
      expect(spectator.inject(DialogService).info).toHaveBeenCalledWith(
        'Email',
        'No e-mail address is set for root user or any other local administrator. Please, configure such an email address first.',
      );
    });

    it('opens new window with OAuth page when user presses Log In To Gmail', async () => {
      await form.fillForm({ 'Send Mail Method': 'GMail OAuth' });

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
      await form.fillForm({ 'Send Mail Method': 'GMail OAuth' });

      const loginButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Gmail' }));
      await loginButton.click();

      expect(spectator.inject<Window>(WINDOW).removeEventListener)
        .toHaveBeenCalledWith('message', expect.any(Function), false);
    });

    it('enables Save button after switching from SMTP to Gmail and completing OAuth', async () => {
      await form.fillForm({ 'Send Mail Method': 'GMail OAuth' });

      expect(spectator.component.canSubmit()).toBe(false);

      const logInButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Gmail' }));
      await logInButton.click();

      expect(spectator.component.canSubmit()).toBe(true);
    });

    it('saves Gmail Oauth config when user authorizes via Gmail and saves the form', async () => {
      await (await getInput('fromemail')).setValue('newfrom@ixsystems.com');
      await (await getInput('fromname')).setValue('Johnny');
      await form.fillForm({ 'Send Mail Method': 'GMail OAuth' });

      const logInButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Gmail' }));
      await logInButton.click();

      spectator.component.submit();

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
      await form.fillForm({ 'Send Mail Method': 'GMail OAuth' });

      const logInButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Gmail' }));
      await logInButton.click();

      const sendTestEmailButton = await loader.getHarness(TnButtonHarness.with({ label: 'Send Test Mail' }));
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
      await form.fillForm({ 'Send Mail Method': 'Outlook OAuth' });

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
      await form.fillForm({ 'Send Mail Method': 'Outlook OAuth' });
      spectator.component.form.controls.fromemail.setValue('');
      spectator.detectChanges();

      expect(spectator.component.canSubmit()).toBe(false);
    });

    it('calls removeEventListener when outlook oAuth callback is called', async () => {
      await form.fillForm({ 'Send Mail Method': 'Outlook OAuth' });

      const loginButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Outlook' }));
      await loginButton.click();

      expect(spectator.inject<Window>(WINDOW).removeEventListener)
        .toHaveBeenCalledWith('message', expect.any(Function), false);
    });

    it('saves Outlook Oauth config when user authorizes via Outlook and saves the form', async () => {
      await (await getInput('fromemail')).setValue('newfrom@ixsystems.com');
      await (await getInput('fromname')).setValue('Johnny');
      await form.fillForm({ 'Send Mail Method': 'Outlook OAuth' });

      const logInButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Outlook' }));
      await logInButton.click();

      spectator.component.submit();

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
      await form.fillForm({ 'Send Mail Method': 'Outlook OAuth' });

      const logInButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Outlook' }));
      await logInButton.click();

      const sendTestEmailButton = await loader.getHarness(TnButtonHarness.with({ label: 'Send Test Mail' }));
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
      spectator = createComponent({ props: { config: fakeEmailConfig } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
    });

    it('saves SMTP config when form is filled and Save is pressed', async () => {
      await (await getInput('fromemail')).setValue('newfrom@ixsystems.com');
      await (await getInput('fromname')).setValue('Jeremy');
      await (await getInput('outgoingserver')).setValue('smtp.ixsystems.com');
      await (await getInput('port')).setValue('21');
      await (await getSelect('security')).selectOption('SSL (Implicit TLS)');
      await (await getCheckbox('smtp')).uncheck();

      spectator.component.submit();

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
      expect(await (await getInput('fromemail')).getValue()).toBe('from@ixsystems.com');
      expect(await (await getInput('fromname')).getValue()).toBe('John Smith');
      expect(await (await getInput('outgoingserver')).getValue()).toBe('smtp.gmail.com');
      expect(await (await getInput('port')).getValue()).toBe('587');
      expect(await (await getSelect('security')).getDisplayText()).toBe('TLS (STARTTLS)');
      expect(await (await getCheckbox('smtp')).isChecked()).toBe(true);
      expect(await (await getInput('pass')).getValue()).toBe('12345678');
      expect(await (await getInput('user')).getValue()).toBe('authuser@ixsystems.com');
    });

    it('sends test email with SMTP settings when SMTP form is used and Send Test Mail is pressed', async () => {
      const sendTestEmailButton = await loader.getHarness(TnButtonHarness.with({ label: 'Send Test Mail' }));
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
      spectator = createComponent({ props: { config: fakeGmailEmailConfig } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
    });

    it('shows current Gmail config when Gmail is set', async () => {
      expect(await (await getInput('fromemail')).getValue()).toBe('from@ixsystems.com');
      expect(await (await getInput('fromname')).getValue()).toBe('John Smith');
      expect(spectator.query('.oauth-message')).toHaveText('Gmail credentials have been applied.');
    });

    it('has Save button enabled when Gmail config is loaded', () => {
      expect(spectator.component.canSubmit()).toBe(true);
    });
  });

  describe('opened from alerts panel without data', () => {
    describe('with Gmail config', () => {
      const fakeGmailConfig = {
        ...fakeEmailConfig,
        oauth: {
          client_id: 'client_id',
          client_secret: 'secret',
          refresh_token: 'token',
          provider: 'gmail',
        },
      } as MailConfig;

      beforeEach(async () => {
        spectator = createComponent({ detectChanges: false });
        spectator.inject(MockApiService).mockCall('mail.config', fakeGmailConfig);
        spectator.detectChanges();
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
      });

      it('fetches email config from API and shows Gmail config with Save enabled', async () => {
        expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('mail.config');

        expect(await (await getInput('fromemail')).getValue()).toBe('from@ixsystems.com');
        expect(await (await getInput('fromname')).getValue()).toBe('John Smith');
        expect(spectator.query('.oauth-message')).toHaveText('Gmail credentials have been applied.');

        expect(spectator.component.canSubmit()).toBe(true);
      });
    });

    describe('with SMTP config', () => {
      beforeEach(async () => {
        spectator = createComponent({ detectChanges: false });
        spectator.inject(MockApiService).mockCall('mail.config', fakeEmailConfig);
        spectator.detectChanges();
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
        api = spectator.inject(ApiService);
      });

      it('fetches email config from API and shows SMTP config', async () => {
        expect(api.call).toHaveBeenCalledWith('mail.config');

        expect(await (await getInput('fromemail')).getValue()).toBe('from@ixsystems.com');
        expect(await (await getInput('fromname')).getValue()).toBe('John Smith');
        expect(await (await getInput('outgoingserver')).getValue()).toBe('smtp.gmail.com');
        expect(await (await getInput('port')).getValue()).toBe('587');
        expect(await (await getSelect('security')).getDisplayText()).toBe('TLS (STARTTLS)');
        expect(await (await getCheckbox('smtp')).isChecked()).toBe(true);
        expect(await (await getInput('pass')).getValue()).toBe('12345678');
        expect(await (await getInput('user')).getValue()).toBe('authuser@ixsystems.com');
      });

      it('saves SMTP config when form is filled and Save is pressed', async () => {
        await (await getInput('fromemail')).setValue('newfrom@ixsystems.com');
        await (await getInput('fromname')).setValue('Jeremy');

        spectator.component.submit();

        expect(api.call).toHaveBeenCalledWith('mail.update', [{
          fromemail: 'newfrom@ixsystems.com',
          fromname: 'Jeremy',
          oauth: null,
          outgoingserver: 'smtp.gmail.com',
          port: 587,
          security: MailSecurity.Tls,
          smtp: true,
          user: 'authuser@ixsystems.com',
          pass: '12345678',
        }]);
      });
    });
  });

  describe('opened from alerts panel with API error', () => {
    it('shows error modal and keeps form open when mail.config request fails', () => {
      spectator = createComponent({ detectChanges: false });
      const closeSpy = jest.spyOn(spectator.component.closed, 'emit');

      when(spectator.inject(MockApiService).call)
        .calledWith('mail.config')
        .mockReturnValue(throwError(() => new Error('Connection error')));

      spectator.detectChanges();

      expect(closeSpy).not.toHaveBeenCalled();
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
      spectator = createComponent({ props: { config: fakeOutlookEmailConfig } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
    });

    it('shows current Outlook config when Outlook is set', async () => {
      expect(await (await getInput('fromemail')).getValue()).toBe('from@ixsystems.com');
      expect(await (await getInput('fromname')).getValue()).toBe('John Smith');
      expect(spectator.query('.oauth-message')).toHaveText('Outlook credentials have been applied.');
    });
  });
});
