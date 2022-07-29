import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { TicketCategory, TicketCriticality, TicketEnvironment } from 'app/enums/file-ticket.enum';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { NewTicketResponse } from 'app/interfaces/support.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { JobItemComponent } from 'app/modules/jobs/components/job-item/job-item.component';
import { FileTicketLicensedFormComponent } from 'app/pages/system/file-ticket/file-ticket-licensed-form/file-ticket-licensed-form.component';
import { WebSocketService, DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('FileTicketLicensedFormComponent', () => {
  let spectator: Spectator<FileTicketLicensedFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const mockNewTicketResponse = {
    ticket: 123456789,
    url: 'https://mock.jira/ticket',
  };

  const createComponent = createComponentFactory({
    component: FileTicketLicensedFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(JobItemComponent),
    ],
    providers: [
      mockProvider(DialogService),
      mockWebsocket([
        mockCall('core.get_jobs', [{
          id: 1,
          method: 'support.new_ticket',
          progress: {
            percent: 99,
            description: 'progress description',
          },
          state: JobState.Running,
        } as Job]),
        mockCall('support.fetch_categories', {
          API: '11008',
          WebUI: '10004',
        }),
        mockJob('support.new_ticket', fakeSuccessfulJob(mockNewTicketResponse as NewTicketResponse)),
        mockJob('support.attach_ticket', fakeSuccessfulJob()),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('sends a create payload to websocket', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Name: 'fakename',
      Email: 'fake@admin.com',
      CC: ['fake@test.com'],
      Phone: '12345678',
      Type: 'Bug',
      Environment: 'Production',
      Criticality: 'Inquiry',
      Subject: 'Test subject',
      Description: 'Testing ticket body',
      'Attach Debug': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.job).toHaveBeenLastCalledWith('support.new_ticket', [{
      name: 'fakename',
      email: 'fake@admin.com',
      cc: ['fake@test.com'],
      phone: '12345678',
      category: TicketCategory.Bug,
      environment: TicketEnvironment.Production,
      criticality: TicketCriticality.Inquiry,
      title: 'Test subject',
      body: 'Testing ticket body',
      attach_debug: true,
    }]);

    expect(spectator.query('ix-job-item')).toBeTruthy();
  });

  it('opens window when User Guide is pressed', async () => {
    jest.spyOn(window, 'open').mockImplementation();
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'User Guide' }));
    await button.click();

    expect(window.open).toHaveBeenCalledWith('https://www.truenas.com/docs/hub/');
  });

  it('redirects to eula page when EULA is pressed', async () => {
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'EULA' }));
    await button.click();

    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['system', 'support', 'eula']);
  });
});
