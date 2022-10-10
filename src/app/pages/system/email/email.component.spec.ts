import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { MailSecurity } from 'app/enums/mail-security.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { GmailOauthConfig, MailConfig } from 'app/interfaces/mail-config.interface';
import { OauthMessage } from 'app/interfaces/oauth-message.interface';
import { User } from 'app/interfaces/user.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService, SystemGeneralService, WebSocketService } from 'app/services';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';
import { EmailComponent } from './email.component';

describe('EmailComponent', () => {
  let spectator: Spectator<EmailComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let ws: WebSocketService;

  const createComponent = createComponentFactory({
    component: EmailComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectSystemInfo, value: { hostname: 'host.truenas.com' } },
        ],
      }),
      mockWebsocket([
        mockCall('mail.config', {
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
        }),
        mockCall('mail.update'),
        mockCall('user.query', [
          { email: 'root@truenas.com' },
        ] as User[]),
        mockJob('mail.send'),
      ]),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockEntityJobComponentRef),
      }),
      mockProvider(SystemGeneralService, {
        getProductType: () => ProductType.Scale,
      }),
      {
        provide: WINDOW,
        useFactory: () => {
          return {
            open: jest.fn(),
            location: {
              toString: () => 'http://truenas.com/system/email',
            } as Location,
            addEventListener: jest.fn((_, listener) => {
              listener({
                data: {
                  oauth_portal: true,
                  result: {
                    refresh_token: 'new_token',
                    client_secret: 'new_secret',
                    client_id: 'new_client_id',
                  },
                },
              } as OauthMessage<GmailOauthConfig>);
            }),
            removeEventListener: jest.fn(),
          } as unknown as Window;
        },
      },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    ws = spectator.inject(WebSocketService);
  });

  it('checks if root email is set when Send Test Mail is pressed and shows a warning if it\'s not', async () => {
    spectator.inject(MockWebsocketService).mockCall('user.query', [
      { email: '' },
    ] as User[]);

    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Send Test Mail' }));
    await button.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('user.query', [[['username', '=', 'root']]]);
    expect(spectator.inject(DialogService).info).toHaveBeenCalledWith(
      'Email',
      'Email for root user is not set. Please, configure the root user email address first.',
    );
  });

  describe('SMTP config', () => {
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

      expect(ws.call).toHaveBeenCalledWith('mail.update', [{
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

      expect(ws.call).toHaveBeenCalledWith('mail.config');
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

      expect(mockEntityJobComponentRef.componentInstance.setCall).toHaveBeenCalledWith(
        'mail.send',
        [
          {
            subject: 'Test Message',
            text: 'This is a test message from TrueNAS SCALE.',
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
    it('shows current Gmail config when Gmail is set', async () => {
      const mockWebsocket = spectator.inject(MockWebsocketService);
      mockWebsocket.mockCall('mail.config', {
        oauth: {
          client_id: 'client_id',
          client_secret: 'secret',
          refresh_token: 'token',
        },
      } as MailConfig);
      spectator.component.ngOnInit();

      const values = await form.getValues();

      expect(values).toEqual({
        'Send Mail Method': 'GMail OAuth',
      });
      expect(spectator.query('.oauth-message')).toHaveText('Gmail credentials have been applied.');
    });

    it('opens new window with OAuth page when user presses Log In To Gmail', async () => {
      await form.fillForm({
        'Send Mail Method': 'GMail OAuth',
      });

      const logInButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Gmail' }));
      await logInButton.click();

      const window = spectator.inject<Window>(WINDOW);
      expect(window.open).toHaveBeenCalledWith(
        'https://freenas.org/oauth/gmail?origin=http%3A%2F%2Ftruenas.com%2Fsystem%2Femail',
        '_blank',
        'width=640,height=480',
      );
      expect(window.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
        false,
      );
    });

    it('saves Gmail Oauth config when user authorizes via Gmail and saves the form', async () => {
      await form.fillForm({
        'Send Mail Method': 'GMail OAuth',
      });

      const logInButton = await loader.getHarness(MatButtonHarness.with({ text: 'Log In To Gmail' }));
      await logInButton.click();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('mail.update', [{
        fromemail: '',
        fromname: '',
        oauth: {
          client_id: 'new_client_id',
          client_secret: 'new_secret',
          refresh_token: 'new_token',
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

      expect(mockEntityJobComponentRef.componentInstance.setCall).toHaveBeenCalledWith(
        'mail.send',
        [
          {
            subject: 'Test Message',
            text: 'This is a test message from TrueNAS SCALE.',
          },
          {
            fromemail: '',
            fromname: '',
            oauth: {
              client_id: 'new_client_id',
              client_secret: 'new_secret',
              refresh_token: 'new_token',
            },
          },
        ],
      );
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
        'Test email sent.',
      );
    });
  });
});
