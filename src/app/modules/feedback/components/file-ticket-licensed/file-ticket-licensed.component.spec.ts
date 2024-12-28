import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  createComponentFactory, createSpyObject, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { TicketCategory, TicketCriticality, TicketEnvironment } from 'app/enums/file-ticket.enum';
import { WINDOW } from 'app/helpers/window.helper';
import {
  FileTicketLicensedComponent,
} from 'app/modules/feedback/components/file-ticket-licensed/file-ticket-licensed.component';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ImageValidatorService } from 'app/modules/forms/ix-forms/validators/image-validator/image-validator.service';

describe('FileTicketLicensedFormComponent', () => {
  let spectator: Spectator<FileTicketLicensedComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let submitButton: MatButtonHarness;
  let feedbackService: FeedbackService;
  const dialogRef = createSpyObject(MatDialogRef);

  const createComponent = createComponentFactory({
    component: FileTicketLicensedComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [],
    providers: [
      mockProvider(FeedbackService, {
        createTicketLicensed: jest.fn(() => of({
          ticket: 24,
          url: 'https://jira-redirect.ixsystems.com/ticket',
        })),
      }),
      mockProvider(ImageValidatorService, {
        getImagesValidator: () => () => of(null as ValidationErrors | null),
      }),
      mockProvider(Router, {
        navigate: jest.fn(() => Promise.resolve(true)),
      }),
      mockWindow(),
      mockApi([
        mockCall('support.attach_ticket_max_size', 5),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: { dialogRef },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Submit' }));
    feedbackService = spectator.inject(FeedbackService);
  });

  async function fillTextFields(): Promise<void> {
    await form.fillForm({
      Name: 'John Wick',
      Email: 'john.wick@gmail.com',
      CC: ['marcus@gmail.com'],
      Phone: '310-564-8005',
      Type: 'Performance',
      Environment: 'Staging',
      Criticality: 'Total Down',
      Subject: 'Assassination Request',
      Message: 'New request',
    });
  }

  it('opens window when User Guide is pressed', async () => {
    const window = spectator.inject<Window>(WINDOW);
    jest.spyOn(window, 'open');
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'User Guide' }));
    await button.click();

    expect(window.open).toHaveBeenCalledWith('https://www.truenas.com/docs/hub/');
  });

  it('redirects to eula page when EULA is pressed', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'EULA' }));
    await button.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['system', 'support', 'eula']);
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('submits a new ticket for an enterprise system when Submit is pressed', async () => {
    const fakeAttachments = [fakeFile('attachment1.png'), fakeFile('attachment2.png')];

    await fillTextFields();

    await form.fillForm(
      {
        'Attach additional images': true,
        'Attach images (optional)': fakeAttachments,
      },
    );

    await submitButton.click();

    expect(feedbackService.createTicketLicensed).toHaveBeenCalledWith({
      attach_debug: true,
      attach_images: true,
      category: TicketCategory.Performance,
      cc: ['marcus@gmail.com'],
      criticality: TicketCriticality.TotalDown,
      email: 'john.wick@gmail.com',
      environment: TicketEnvironment.Staging,
      images: fakeAttachments,
      message: 'New request',
      name: 'John Wick',
      phone: '310-564-8005',
      take_screenshot: true,
      title: 'Assassination Request',
    });
    expect(dialogRef.close).toHaveBeenCalled();
    expect(feedbackService.showTicketSuccessMsg).toHaveBeenCalledWith('https://jira-redirect.ixsystems.com/ticket');
  });
});

// TODO: Test that it doesn't crash if attachments were not uploaded
