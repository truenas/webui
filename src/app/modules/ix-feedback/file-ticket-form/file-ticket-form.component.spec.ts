import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { FileTicketFormComponent } from 'app/modules/ix-feedback/file-ticket-form/file-ticket-form.component';
import { NewTicketResponse } from 'app/modules/ix-feedback/interfaces/file-ticket.interface';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { JiraOauthComponent } from 'app/modules/ix-forms/components/jira-oauth/jira-oauth.component';
import { JiraOauthHarness } from 'app/modules/ix-forms/components/jira-oauth/jira-oauth.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { OauthButtonComponent } from 'app/modules/oauth-button/components/oauth-button/oauth-button.component';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('FileTicketFormComponent', () => {
  let spectator: Spectator<FileTicketFormComponent>;
  let loader: HarnessLoader;
  let ws: MockWebsocketService;

  const mockToken = JSON.stringify({
    oauth_token: 'mock.oauth.token',
    oauth_token_secret: 'mock.oauth.token.secret',
  });

  const mockNewTicketResponse = {
    ticket: 123456789,
    url: 'https://mock.jira/ticket',
  };

  const createComponent = createComponentFactory({
    component: FileTicketFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
      TooltipModule,
    ],
    declarations: [
      JiraOauthComponent,
      OauthButtonComponent,
    ],
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockWebsocket([
        mockCall('core.get_jobs', [{
          id: 1,
          method: 'support.new_ticket',
          progress: {
            percent: 99,
            description: 'progress description',
          },
          state: JobState.Running,
        }] as Job[]),
        mockCall('support.fetch_categories', {
          API: '11008',
          WebUI: '10004',
        }),
        mockJob('support.new_ticket', fakeSuccessfulJob(mockNewTicketResponse as NewTicketResponse)),
        mockJob('support.attach_ticket', fakeSuccessfulJob()),
      ]),
      mockProvider(AuthService, {
        authToken$: of('token.is.mocked'),
      }),
      mockProvider(FormErrorHandlerService),
      mockProvider(SystemGeneralService, {
        isEnterprise: jest.fn(() => false),
        getTokenForJira: jest.fn(() => mockToken),
        setTokenForJira: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(MockWebsocketService);
  });

  it.skip('loads ticket categories using api token when token is provided', fakeAsync(async () => {
    const jiraButton = await loader.getHarness(JiraOauthHarness);
    await jiraButton.setValue(mockToken);

    spectator.tick(300);
    await spectator.fixture.whenStable();

    expect(ws.call).toHaveBeenCalledWith('support.fetch_categories', [mockToken]);

    const categorySelect = await loader.getHarness(IxSelectHarness.with({ label: 'Category' }));
    expect(await categorySelect.getOptionLabels()).toEqual(['WebUI', 'API']);
    await categorySelect.setValue('WebUI');
  }));

  it('returns payload for new ticket when getPayload is called', async () => {
    const title = await loader.getHarness(IxInputHarness.with({ label: 'Subject' }));
    await title.setValue('Test subject');

    expect(spectator.component.getPayload()).toEqual({
      category: '',
      title: 'Test subject',
      token: mockToken,
    });
  });
});
