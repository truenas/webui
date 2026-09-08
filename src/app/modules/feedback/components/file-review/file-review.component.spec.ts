import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { NgTemplateOutlet } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  createHostFactory, createSpyObject, mockProvider, SpectatorHost,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnCheckboxHarness, TnFormFieldHarness, TnInputHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { FileReviewComponent } from 'app/modules/feedback/components/file-review/file-review.component';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { IxStarRatingComponent } from 'app/modules/forms/ix-forms/components/ix-star-rating/ix-star-rating.component';
import { IxStarRatingHarness } from 'app/modules/forms/ix-forms/components/ix-star-rating/ix-star-rating.harness';
import { TnFileInputTestHarness } from 'app/modules/forms/ix-forms/testing/tn-file-input.harness';

describe('FileReviewComponent', () => {
  let spectator: SpectatorHost<FileReviewComponent>;
  let loader: HarnessLoader;
  let submitButton: TnButtonHarness;
  let feedbackService: FeedbackService;
  const dialogRef = createSpyObject(DialogRef);

  const createHost = createHostFactory({
    component: FileReviewComponent,
    imports: [
      ReactiveFormsModule,
      IxStarRatingComponent,
      NgTemplateOutlet,
    ],
    providers: [
      mockApi([
        mockCall('system.product_type'),
      ]),
      mockWindow(),
      mockProvider(FeedbackService, {
        createReview: jest.fn(() => of()),
      }),
      provideMockStore({
        initialState: {
          systemInfo: {
            productType: ProductType.CommunityEdition,
          } as unknown as SystemInfo,
        },
      }),
    ],
  });

  beforeEach(async () => {
    // The dialog projects the form's actions into the shell footer; render that template here.
    spectator = createHost(
      `<ix-file-review #review [dialogRef]="dialogRef"></ix-file-review>
       <ng-container [ngTemplateOutlet]="review.dialogActions() ?? null"></ng-container>`,
      { hostProps: { dialogRef } },
    );
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    submitButton = await loader.getHarness(TnButtonHarness.with({ label: 'Submit' }));
    feedbackService = spectator.inject(FeedbackService);
  });

  it('labels the rating through its form field and marks it required', async () => {
    const ratingField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Select Rating' }));

    expect(await ratingField.getLabel()).toBe('Select Rating');
    expect(await ratingField.isRequired()).toBe(true);
  });

  it('uploads a new rating when form is submitted', async () => {
    const fakeAttachments = [fakeFile('attachment1.png'), fakeFile('attachment2.png')];

    await (await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Take screenshot of the current page' }),
    )).check();
    await (await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Attach additional images' }),
    )).check();

    await (await loader.getHarness(IxStarRatingHarness)).setValue(1);
    await (await loader.getHarness(TnInputHarness)).setValue('Git gud');
    await (await loader.getHarness(TnFileInputTestHarness)).setValue(fakeAttachments);

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
