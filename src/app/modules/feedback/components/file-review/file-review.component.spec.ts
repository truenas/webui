import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import {
  createComponentFactory, createSpyObject, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { FileReviewComponent } from 'app/modules/feedback/components/file-review/file-review.component';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { IxStarRatingComponent } from 'app/modules/forms/ix-forms/components/ix-star-rating/ix-star-rating.component';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';

describe('FileReviewComponent', () => {
  let spectator: Spectator<FileReviewComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let submitButton: MatButtonHarness;
  let feedbackService: FeedbackService;
  const dialogRef = createSpyObject(MatDialogRef);

  const createComponent = createComponentFactory({
    component: FileReviewComponent,
    imports: [
      ReactiveFormsModule,
      IxStarRatingComponent,
    ],
    providers: [
      mockProvider(FeedbackService, {
        createReview: jest.fn(() => of()),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        dialogRef,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Submit' }));
    feedbackService = spectator.inject(FeedbackService);
  });

  it('uploads a new rating when form is submitted', async () => {
    const fakeAttachments = [fakeFile('attachment1.png'), fakeFile('attachment2.png')];

    await form.fillForm(
      {
        'Select Rating': 1,
        Message: 'Git gud',
        'Take screenshot of the current page': true,
        'Attach additional images': true,
        'Attach images (optional)': fakeAttachments,
      },
    );

    await submitButton.click();

    expect(feedbackService.createReview).toHaveBeenCalledWith({
      attach_images: true,
      images: fakeAttachments,
      message: 'Git gud',
      rating: 1,
      take_screenshot: true,
    });
  });
});
