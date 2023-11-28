import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { FileTicketFormComponent } from 'app/modules/ix-feedback/file-ticket-form/file-ticket-form.component';
import { NewTicketResponse } from 'app/modules/ix-feedback/interfaces/file-ticket.interface';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { JiraOauthComponent } from 'app/modules/ix-forms/components/jira-oauth/jira-oauth.component';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { OauthButtonComponent } from 'app/modules/oauth-button/components/oauth-button/oauth-button.component';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('FileTicketFormComponent', () => {
  let spectator: Spectator<FileTicketFormComponent>;
  let loader: HarnessLoader;

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
      IxFormsModule,
      ReactiveFormsModule,
      TooltipModule,
    ],
    declarations: [
      JiraOauthComponent,
      MockComponent(OauthButtonComponent),
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
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(SystemGeneralService, {
        getTokenForJira: jest.fn(() => mockToken),
        setTokenForJira: jest.fn(),
      }),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('returns payload for new ticket when getPayload is called', async () => {
    const title = await loader.getHarness(IxInputHarness.with({ label: 'Subject' }));
    await title.setValue('Test subject');

    // const category = await loader.getHarness(IxSelectHarness.with({ label: 'Category' }));
    // await category.setValue('WebUI');

    expect(spectator.component.getPayload()).toEqual({
      category: '',
      title: 'Test subject',
      token: mockToken,
    });
  });
});
