import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { JobState } from 'app/enums/job-state.enum';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { JobItemComponent } from 'app/modules/jobs/components/job-item/job-item.component';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { FileTicketFormComponent } from 'app/pages/system/file-ticket/file-ticket-form/file-ticket-form.component';
import { WebSocketService, DialogService, SystemGeneralService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { JiraOauthComponent } from './components/jira-oauth/jira-oauth.component';

describe('FileTicketFormComponent', () => {
  const onCloseSubject$ = new Subject<boolean>();
  let spectator: Spectator<FileTicketFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

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
      MockComponent(JobItemComponent),
    ],
    providers: [
      mockProvider(DialogService),
      mockProvider(WebSocketService, {
        token: 'token.is.mocked',
        onCloseSubject$,
        job: jest.fn((method) => {
          switch (method) {
            case 'support.new_ticket':
              return of(fakeSuccessfulJob(mockNewTicketResponse));
            case 'support.attach_ticket':
              return of(fakeSuccessfulJob());
          }
        }),
        call: jest.fn((method) => {
          switch (method) {
            case 'core.get_jobs':
              return of([{
                id: 1,
                method: 'support.new_ticket',
                progress: {
                  percent: 99,
                  description: 'progress description',
                },
                state: JobState.Running,
              }]);
            case 'support.fetch_categories':
              return of({
                API: '11008',
                WebUI: '10004',
              });
          }
        }),
      }),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(SystemGeneralService, {
        getTokenForJira: jest.fn(() => 'token.is.mocked'),
        setTokenForJira: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads ticket categories using api token when form is opened', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual(
      {
        Token: 'token.is.mocked',
        'Attach screenshots': [],
        Category: '',
        Subject: '',
        Body: '',
        Type: 'Bug',
        'Attach Debug': false,
      },
    );
    expect(ws.call).toHaveBeenCalledWith('support.fetch_categories', ['token.is.mocked']);
  });

  it('sends a create payload to websocket', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Token: 'token.is.mocked',
      Category: 'WebUI',
      Subject: 'Test subject',
      Body: 'Testing ticket body',
      Type: 'Bug',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.job).toHaveBeenLastCalledWith('support.new_ticket', [{
      body: 'Testing ticket body',
      category: '10004',
      title: 'Test subject',
      token: 'token.is.mocked',
      type: 'BUG',
    }]);

    expect(spectator.query('ix-job-item')).toBeTruthy();
  });
});
