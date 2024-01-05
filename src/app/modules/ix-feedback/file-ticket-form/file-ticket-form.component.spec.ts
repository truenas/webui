import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { mockProvider, createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { FileTicketFormComponent } from 'app/modules/ix-feedback/file-ticket-form/file-ticket-form.component';
import { similarTickets } from 'app/modules/ix-feedback/file-ticket-form/similar-tickets.mock';
import { IxFeedbackService } from 'app/modules/ix-feedback/ix-feedback.service';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';

describe('FileTicketFormComponent', () => {
  let spectator: Spectator<FileTicketFormComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: FileTicketFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    declarations: [],
    providers: [
      mockProvider(IxFeedbackService, {
        oauthToken$: of('test-token'),
        getOauthToken: jest.fn(() => 'test-token'),
        getSimilarIssues: jest.fn(() => of(similarTickets)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('returns payload for new ticket when getPayload is called', async () => {
    const title = await loader.getHarness(IxInputHarness.with({ label: 'Subject' }));
    await title.setValue('Test subject');

    expect(spectator.component.getPayload()).toEqual({
      title: 'Test subject',
    });
  });

  it('checks for similar issues when title is changed', async () => {
    const title = await loader.getHarness(IxInputHarness.with({ label: 'Subject' }));
    await title.setValue('Similar');

    expect(spectator.inject(IxFeedbackService).getSimilarIssues).toHaveBeenCalledWith('Similar');
    expect(spectator.query('.similar-issue-title')).toHaveExactText('The following issues were already reported.');
    expect(spectator.query('.similar-issue-subtitle')).toHaveExactText('Do any of them look similar?');
    expect(spectator.queryAll('.similar-issue')).toHaveLength(5);
  });
});
