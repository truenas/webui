import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { mockProvider, createRoutingFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockWebsocket, mockCall, mockJob } from 'app/core/testing/utils/mock-websocket.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { TicketCategory, TicketEnvironment, TicketCriticality } from 'app/enums/file-ticket.enum';
import { JobState } from 'app/enums/job-state.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { Job } from 'app/interfaces/job.interface';
import { NewTicketResponse } from 'app/interfaces/support.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { FeedbackDialogComponent } from 'app/modules/ix-feedback/feedback-dialog/feedback-dialog.component';
import { IxFeedbackService } from 'app/modules/ix-feedback/ix-feedback.service';
import { IxButtonGroupHarness } from 'app/modules/ix-forms/components/ix-button-group/ix-button-group.harness';
import { IxCheckboxHarness } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxFileInputHarness } from 'app/modules/ix-forms/components/ix-file-input/ix-file-input.harness';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxStarRatingHarness } from 'app/modules/ix-forms/components/ix-star-rating/ix-star-rating.harness';
import { IxTextareaHarness } from 'app/modules/ix-forms/components/ix-textarea/ix-textarea.harness';
import { JiraOauthComponent } from 'app/modules/ix-forms/components/jira-oauth/jira-oauth.component';
import { JiraOauthHarness } from 'app/modules/ix-forms/components/jira-oauth/jira-oauth.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { OauthButtonComponent } from 'app/modules/oauth-button/components/oauth-button/oauth-button.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('FeedbackDialogComponent', () => {
  let spectator: Spectator<FeedbackDialogComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const isEnterprise$ = new BehaviorSubject(false);

  const mockToken = JSON.stringify({
    oauth_token: 'mock.oauth.token',
    oauth_token_secret: 'mock.oauth.token.secret',
  });

  const mockNewTicketResponse = {
    ticket: 123456789,
    url: 'https://mock.jira/ticket',
  };

  const createComponent = createRoutingFactory({
    component: FeedbackDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    declarations: [
      JiraOauthComponent,
      MockComponent(OauthButtonComponent),
    ],
    providers: [
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
        mockCall('system.build_time', { $date: 1694835361000 }),
      ]),
      mockProvider(AuthService, {
        authToken$: of('token.is.mocked'),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {},
      },
      mockProvider(IxFeedbackService, {
        addReview: jest.fn(() => of({ success: true, review_id: 1 })),
        addAttachment: jest.fn(() => of({
          data: {
            date_created: 'Thu, 22 Jun 2023 06:54:48 GMT',
            filename: '8e2182dc-e400-4ebe-af6f-132cb8ffc5c5.png',
            id: 6,
          },
          message: 'Image uploaded successfully',
        })),
        takeScreenshot: jest.fn(() => of(new File(['(⌐□_□)'], 'screenshot.png', { type: 'image/png' }))),
        getHostId: jest.fn(() => of('unique-system-host-id-1234')),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemInfo,
            value: {
              version: 'TN-RELEASE',
            } as SystemInfo,
          },
        ],
      }),
      mockWindow({
        open: jest.fn(),
        navigator: {
          userAgent: 'mocked user agent',
        },
        location: {
          pathname: '/',
        },
      }),
      mockProvider(SystemGeneralService, {
        get isEnterprise(): boolean {
          return isEnterprise$.value;
        },
        getTokenForJira: jest.fn(() => mockToken),
        setTokenForJira: jest.fn(),
      }),
      mockProvider(MatDialogRef),
      mockProvider(SnackbarService),
      mockProvider(IxSlideInRef),
      mockProvider(Router),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('checks the header', () => {
    expect(spectator.query('h1')).toHaveText('How would you rate this page?');
  });

  describe('review', () => {
    beforeEach(async () => {
      const type = await loader.getHarness(IxButtonGroupHarness.with({ label: 'I would like to' }));
      type.setValue('rate this page');
    });

    it('checks submit a new review', async () => {
      const rating = await loader.getHarness(IxStarRatingHarness.with({ label: 'Select rating' }));
      await rating.setValue(5);

      const message = await loader.getHarness(IxTextareaHarness.with({ label: 'Message' }));
      await message.setValue('hi there. can you improve this?. thanks.');

      const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Submit' }));
      await submitButton.click();

      expect(spectator.inject(IxFeedbackService).addReview).toHaveBeenCalledWith({
        environment: 'development',
        extra: {},
        host_u_id: 'unique-system-host-id-1234',
        release: 'TN-RELEASE',
        message: 'hi there. can you improve this?. thanks.',
        rating: 5,
        page: '/',
        user_agent: 'mocked user agent',
      });
      expect(spectator.inject(IxFeedbackService).addAttachment).toHaveBeenCalled();
      expect(spectator.inject(IxFeedbackService).takeScreenshot).toHaveBeenCalled();
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });

    it('checks submit a new review with an attachment', async () => {
      const rating = await loader.getHarness(IxStarRatingHarness.with({ label: 'Select rating' }));
      await rating.setValue(5);

      const message = await loader.getHarness(IxTextareaHarness.with({ label: 'Message' }));
      await message.setValue('hi there. can you improve this?. thanks.');

      const takeScreenshot = await loader.getHarness(IxCheckboxHarness.with({ label: 'Take screenshot of the current page' }));
      await takeScreenshot.setValue(false);

      const attachImages = await loader.getHarness(IxCheckboxHarness.with({ label: 'Attach additional images' }));
      await attachImages.setValue(true);

      const attachmentFile = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
      const image = await loader.getHarness(IxFileInputHarness.with({ label: 'Attach image (optional)' }));
      await image.setValue([attachmentFile]);

      const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Submit' }));
      await submitButton.click();

      expect(spectator.inject(IxFeedbackService).addReview).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'hi there. can you improve this?. thanks.',
          rating: 5,
        }),
      );
      expect(spectator.inject(IxFeedbackService).addAttachment).toHaveBeenCalled();
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });

  describe('bug or improvement', () => {
    beforeEach(async () => {
      isEnterprise$.next(false);
      const type = await loader.getHarness(IxButtonGroupHarness.with({ label: 'I would like to' }));
      type.setValue('report a bug');
    });

    it('loads ticket categories using api token when token is provided', async () => {
      const form = await loader.getHarness(IxFormHarness);

      const jiraButton = await loader.getHarness(JiraOauthHarness);
      await jiraButton.setValue(mockToken);

      const values = await form.getValues();
      expect(values).toEqual(
        {
          'I would like to': 'report a bug',
          Category: '',
          Subject: '',
          Message: '',
          'Take screenshot of the current page': true,
          'Attach debug': false,
          'Attach additional images': false,
        },
      );
      expect(ws.call).toHaveBeenCalledWith('support.fetch_categories', [mockToken]);
    });

    it('sends a create payload to websocket', async () => {
      const form = await loader.getHarness(IxFormHarness);

      const jiraButton = await loader.getHarness(JiraOauthHarness);
      await jiraButton.setValue(mockToken);

      await form.fillForm({
        Category: 'WebUI',
        Subject: 'Test subject',
        Message: 'Testing ticket body',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Submit' }));
      await saveButton.click();

      expect(ws.job).toHaveBeenLastCalledWith('support.new_ticket', [{
        body: 'Testing ticket body',
        category: '10004',
        title: 'Test subject',
        token: mockToken,
        type: 'BUG',
      }]);
    });
  });

  describe('enterprise: bug or improvement', () => {
    beforeEach(async () => {
      isEnterprise$.next(true);
      const type = await loader.getHarness(IxButtonGroupHarness.with({ label: 'I would like to' }));
      type.setValue('report a bug');
    });

    it('sends a create payload to websocket', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Name': 'fakename',
        Email: 'fake@admin.com',
        CC: ['fake@test.com'],
        Phone: '12345678',
        Type: 'Bug',
        Environment: 'Production',
        Criticality: 'Inquiry',
        Subject: 'Test subject',
        Message: 'Testing ticket body',
        'Attach debug': true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Submit' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('support.new_ticket', [{
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
    });

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
    });
  });
});
