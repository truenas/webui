import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import {
  createComponentFactory, createSpyObject, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { TicketType } from 'app/enums/file-ticket.enum';
import { FileTicketComponent } from 'app/modules/feedback/components/file-ticket/file-ticket.component';
import { SimilarIssuesComponent } from 'app/modules/feedback/components/similar-issues/similar-issues.component';
import { FeedbackType } from 'app/modules/feedback/interfaces/feedback.interface';
import { CreateNewTicket } from 'app/modules/feedback/interfaces/file-ticket.interface';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { ImageValidatorService } from 'app/modules/ix-forms/validators/image-validator/image-validator.service';
import { OauthButtonComponent } from 'app/modules/oauth-button/components/oauth-button/oauth-button.component';
import { OauthButtonType } from 'app/modules/oauth-button/interfaces/oauth-button.interface';

describe('FileTicketComponent', () => {
  let spectator: Spectator<FileTicketComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let loginToJiraButton: OauthButtonComponent;
  let feedbackService: FeedbackService;
  const dialogRef = createSpyObject(MatDialogRef);

  const createComponent = createComponentFactory({
    component: FileTicketComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    declarations: [
      MockComponent(OauthButtonComponent),
      MockComponent(SimilarIssuesComponent),
    ],
    providers: [
      mockProvider(FeedbackService, {
        createNewTicket: jest.fn(() => of({ ticket: 24 })),
        addTicketAttachments: jest.fn(() => of(undefined)),
        addDebugInfoToMessage: (message: string) => of(`${message} Session ID: 12345`),
      }),
      mockProvider(ImageValidatorService, {
        validateImages: () => () => of(null as ValidationErrors),
      }),
    ],
  });

  const expectedTicket = {
    attach_debug: true,
    title: 'Cannot shutdown',
    body: 'Help me Session ID: 12345',
    token: 'jira-token',
    type: TicketType.Bug,
  } as CreateNewTicket;

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        dialogRef,
        type: FeedbackType.Bug,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    loginToJiraButton = spectator.query(OauthButtonComponent);
    feedbackService = spectator.inject(FeedbackService);
  });

  it('renders login to Jira button', () => {
    expect(loginToJiraButton).toBeTruthy();
    expect(loginToJiraButton.oauthType).toBe(OauthButtonType.Jira);
    expect(loginToJiraButton.oauthUrl).toBe('https://support-proxy.ixsystems.com/oauth/initiate?origin=');
  });

  it('renders similar issues and passes in title as it is entered', async () => {
    const similarIssues = spectator.query(SimilarIssuesComponent);
    expect(similarIssues).toBeTruthy();

    await form.fillForm({
      Subject: 'Cannot shutdown',
    });

    expect(similarIssues.query).toBe('Cannot shutdown');
  });

  it('submits a ticket using form values and type input once user fill form and logs in to Jira', async () => {
    await form.fillForm({
      Subject: 'Cannot shutdown',
      Message: 'Help me',
      'Attach debug': true,
    });

    loginToJiraButton.loggedIn.emit('jira-token');

    expect(feedbackService.createNewTicket).toHaveBeenCalledWith(expectedTicket);
    expect(dialogRef.close).toHaveBeenCalled();
    // TODO: Show link to Jira ticket.
  });

  it('takes screenshot and uploads attachments if they are added', async () => {
    const fakeAttachments = [fakeFile('attachment1.png'), fakeFile('attachment2.png')];

    await form.fillForm({
      Subject: 'Cannot shutdown',
      Message: 'Help me',
      'Attach debug': true,
      'Take screenshot of the current page': true,
      'Attach additional images': true,
    });
    await form.fillForm({
      'Attach images (optional)': fakeAttachments,
    });

    loginToJiraButton.loggedIn.emit('jira-token');

    expect(feedbackService.createNewTicket).toHaveBeenCalledWith(expectedTicket);
    expect(feedbackService.addTicketAttachments).toHaveBeenCalledWith({
      token: 'jira-token',
      ticketId: 24,
      takeScreenshot: true,
      attachments: fakeAttachments,
    });
  });

  // TODO: Test case for not failing if images were not uploaded.
});
