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
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { TicketCategory, TicketEnvironment } from 'app/enums/file-ticket.enum';
import { WINDOW } from 'app/helpers/window.helper';
import {
  FileTicketLicensedComponent,
} from 'app/modules/feedback/components/file-ticket-licensed/file-ticket-licensed.component';
import { CreateNewTicket } from 'app/modules/feedback/interfaces/file-ticket.interface';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { ImageValidatorService } from 'app/modules/ix-forms/validators/image-validator/image-validator.service';

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
      IxFormsModule,
      ReactiveFormsModule,
    ],
    declarations: [],
    providers: [
      mockProvider(FeedbackService, {
        createNewTicket: jest.fn(() => of({ ticket: 24 })),
        addTicketAttachments: jest.fn(() => of(undefined)),
        addDebugInfoToMessage: (message: string) => of(`${message} Session ID: 12345`),
      }),
      mockProvider(ImageValidatorService, {
        validateImages: () => () => of(null as ValidationErrors),
      }),
      mockProvider(Router),
      mockWindow(),
    ],
  });

  const expectedTicket = {
    attach_debug: true,
    body: 'New request Session ID: 12345',
    category: TicketCategory.Performance,
    cc: ['marcus@gmail.com'],
    criticality: 'total_down',
    email: 'john.wick@gmail.com',
    environment: TicketEnvironment.Staging,
    name: 'John Wick',
    phone: '310-564-8005',
    title: 'Assassination Request',
  } as CreateNewTicket;

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
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();

    const button = await loader.getHarness(MatButtonHarness.with({ text: 'EULA' }));
    await button.click();

    expect(router.navigate).toHaveBeenCalledWith(['system', 'support', 'eula']);
    // TODO: Does not close modal. Should it?
  });

  it('submits a new ticket for an enterprise system when Submit is pressed', async () => {
    await fillTextFields();

    await submitButton.click();

    expect(feedbackService.createNewTicket).toHaveBeenCalledWith(expectedTicket);
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('takes screenshot and uploads attachments if they are added', async () => {
    const fakeAttachments = [fakeFile('attachment1.png'), fakeFile('attachment2.png')];

    await fillTextFields();
    await form.fillForm({
      'Attach additional images': true,
    });
    await form.fillForm({
      'Attach images (optional)': fakeAttachments,
    });

    await submitButton.click();

    expect(feedbackService.createNewTicket).toHaveBeenCalledWith(expectedTicket);
    expect(feedbackService.addTicketAttachments).toHaveBeenCalledWith({
      ticketId: 24,
      takeScreenshot: true,
      attachments: fakeAttachments,
    });
  });
});

// TODO: Test that it doesn't crash if attachments were not uploaded
