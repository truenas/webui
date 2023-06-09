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
import { IxStarRatingHarness } from 'app/modules/ix-forms/components/ix-star-rating/ix-star-rating.harness';
import { IxTextareaHarness } from 'app/modules/ix-forms/components/ix-textarea/ix-textarea.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { FileTicketFormComponent } from 'app/pages/system/file-ticket/file-ticket-form/file-ticket-form.component';
import { DialogService } from 'app/services';
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

  it('checks new review submission', async () => {
    const rating = await loader.getHarness(IxStarRatingHarness.with({ label: 'Select rating' }));
    await rating.setValue(5);

    const message = await loader.getHarness(IxTextareaHarness.with({ label: 'Message' }));
    await message.setValue('hi there. can you improve this?. thanks.');

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Submit' }));
    await submitButton.click();

    expect(spectator.inject(IxFeedbackService).addReview).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'hi there. can you improve this?. thanks.',
        rating: 5,
      }),
    );
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });
});
