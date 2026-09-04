import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { NgTemplateOutlet } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  createHostFactory, createSpyObject, mockProvider, SpectatorHost,
} from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { FileReviewComponent } from 'app/modules/feedback/components/file-review/file-review.component';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { IxStarRatingComponent } from 'app/modules/forms/ix-forms/components/ix-star-rating/ix-star-rating.component';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { EntitlementsService } from 'app/services/entitlements.service';

describe('FileReviewComponent', () => {
  let spectator: SpectatorHost<FileReviewComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let submitButton: TnButtonHarness;
  let feedbackService: FeedbackService;
  const dialogRef = createSpyObject(DialogRef);
  let deniedFeatures: EntitlementFeature[] = [EntitlementFeature.Support];

  const createHost = createHostFactory({
    component: FileReviewComponent,
    imports: [
      ReactiveFormsModule,
      IxStarRatingComponent,
      NgTemplateOutlet,
    ],
    providers: [
      mockApi(),
      mockProvider(FeedbackService, {
        createReview: jest.fn(() => of()),
      }),
      mockProvider(EntitlementsService, {
        entitled: (feature: EntitlementFeature) => () => !deniedFeatures.includes(feature),
      }),
    ],
  });

  // The dialog projects the form's actions into the shell footer; render that template here.
  const hostTemplate = `<ix-file-review #review [dialogRef]="dialogRef"></ix-file-review>
       <ng-container [ngTemplateOutlet]="review.dialogActions() ?? null"></ng-container>`;

  function hasVoteLink(): boolean {
    return spectator.queryAll('p').some((paragraph) => (paragraph.textContent ?? '').includes('vote for new features'));
  }

  beforeEach(async () => {
    spectator = createHost(hostTemplate, { hostProps: { dialogRef } });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    submitButton = await loader.getHarness(TnButtonHarness.with({ label: 'Submit' }));
    feedbackService = spectator.inject(FeedbackService);
  });

  it('uploads a new rating when form is submitted', async () => {
    const fakeAttachments = [fakeFile('attachment1.png'), fakeFile('attachment2.png')];

    await (await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Take screenshot of the current page' }),
    )).check();
    await (await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Attach additional images' }),
    )).check();

    await form.fillForm(
      {
        'Select Rating': 1,
        Message: 'Git gud',
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

  it('shows the forum feature-vote link without a support entitlement', () => {
    expect(hasVoteLink()).toBe(true);
  });

  describe('with a support entitlement', () => {
    beforeAll(() => {
      deniedFeatures = [];
    });

    afterAll(() => {
      deniedFeatures = [EntitlementFeature.Support];
    });

    it('hides the forum feature-vote link', () => {
      expect(hasVoteLink()).toBe(false);
    });
  });
});
