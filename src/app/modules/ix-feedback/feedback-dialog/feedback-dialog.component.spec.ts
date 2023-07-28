import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { mockProvider, createRoutingFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { FeedbackDialogComponent } from 'app/modules/ix-feedback/feedback-dialog/feedback-dialog.component';
import { IxFeedbackService } from 'app/modules/ix-feedback/ix-feedback.service';
import { IxFileInputHarness } from 'app/modules/ix-forms/components/ix-file-input/ix-file-input.harness';
import { IxSlideToggleHarness } from 'app/modules/ix-forms/components/ix-slide-toggle/ix-slide-toggle.harness';
import { IxStarRatingHarness } from 'app/modules/ix-forms/components/ix-star-rating/ix-star-rating.harness';
import { IxTextareaHarness } from 'app/modules/ix-forms/components/ix-textarea/ix-textarea.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { FileTicketFormComponent } from 'app/pages/system/file-ticket/file-ticket-form/file-ticket-form.component';
import { DialogService } from 'app/services/dialog.service';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('FeedbackDialogComponent', () => {
  let spectator: Spectator<FeedbackDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createRoutingFactory({
    component: FeedbackDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(FileTicketFormComponent),
    ],
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {},
      },
      mockProvider(MatDialogRef),
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
      mockProvider(SnackbarService),
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
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks the header', () => {
    expect(spectator.query('h1')).toHaveText('How would you rate this page?');
  });

  it('checks the file ticket form suggestion', () => {
    expect(spectator.query('.file-ticket-helper')).toHaveText('Submitting a bug?');
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
      user_agent: expect.anything(),
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

    const takeScreenshot = await loader.getHarness(IxSlideToggleHarness.with({ label: 'Take screenshot of the current page' }));
    await takeScreenshot.setValue(false);

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
