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
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { OauthButtonType } from 'app/modules/buttons/oauth-button/interfaces/oauth-button.interface';
import { OauthButtonComponent } from 'app/modules/buttons/oauth-button/oauth-button.component';
import { FileTicketComponent } from 'app/modules/feedback/components/file-ticket/file-ticket.component';
import { SimilarIssuesComponent } from 'app/modules/feedback/components/similar-issues/similar-issues.component';
import { FeedbackType } from 'app/modules/feedback/interfaces/feedback.interface';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ImageValidatorService } from 'app/modules/forms/ix-forms/validators/image-validator/image-validator.service';

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
    ],
    declarations: [
      MockComponent(OauthButtonComponent),
      MockComponent(SimilarIssuesComponent),
    ],
    providers: [
      mockProvider(FeedbackService, {
        createTicket: jest.fn(() => of({
          ticket: 24,
          url: 'https://jira-redirect.ixsystems.com/ticket',
        })),
      }),
      mockProvider(ImageValidatorService, {
        getImagesValidator: () => () => of(null as ValidationErrors),
      }),
      mockApi([
        mockCall('support.attach_ticket_max_size', 5),
      ]),
    ],
  });

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
    const fakeAttachments = [fakeFile('attachment1.png'), fakeFile('attachment2.png')];

    await form.fillForm(
      {
        Subject: 'Cannot shutdown',
        Message: 'Help me',
        'Attach debug': true,
        'Take screenshot of the current page': true,
        'Attach additional images': true,
        'Attach images (optional)': fakeAttachments,
      },
    );

    loginToJiraButton.loggedIn.emit('jira-token');

    expect(feedbackService.createTicket).toHaveBeenCalledWith('jira-token', FeedbackType.Bug, {
      attach_debug: true,
      attach_images: true,
      images: fakeAttachments,
      message: 'Help me',
      take_screenshot: true,
      title: 'Cannot shutdown',
    });
    expect(dialogRef.close).toHaveBeenCalled();
    expect(feedbackService.showTicketSuccessMsg).toHaveBeenCalledWith('https://jira-redirect.ixsystems.com/ticket');
    // TODO: Show link to Jira ticket.
  });

  // TODO: Test case for not failing if images were not uploaded.
});
