import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import {
  createComponentFactory, createSpyObject, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of, throwError } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { FileReviewComponent } from 'app/modules/feedback/components/file-review/file-review.component';
import { FeedbackService } from 'app/modules/feedback/feedback.service';
import { FeedbackEnvironment } from 'app/modules/feedback/interfaces/feedback.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { SystemInfoState } from 'app/store/system-info/system-info.reducer';
import { selectSystemInfoState } from 'app/store/system-info/system-info.selectors';

describe('FileReviewComponent', () => {
  let spectator: Spectator<FileReviewComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let submitButton: MatButtonHarness;
  let feedbackService: FeedbackService;
  const fakeScreenshot = fakeFile('screenshot.png');
  const dialogRef = createSpyObject(MatDialogRef);

  const createComponent = createComponentFactory({
    component: FileReviewComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectSystemInfoState,
            value: {
              systemInfo: {
                version: 'SCALE-24.04',
                system_product: 'M40',
              },
              isIxHardware: true,
              systemHostId: 'testHostId',
            } as SystemInfoState,
          },
        ],
      }),
      mockWindow({
        location: {
          pathname: '/storage',
        },
        navigator: {
          userAgent: 'Safari',
        },
      }),
      mockProvider(SystemGeneralService, {
        getProductType: jest.fn(() => ProductType.ScaleEnterprise),
      }),
      mockProvider(FeedbackService, {
        addReview: jest.fn(() => of({
          review_id: 23,
          success: true,
        })),
        takeScreenshot: jest.fn(() => of(fakeScreenshot)),
        addReviewAttachment: jest.fn(() => of(undefined)),
      }),
      mockProvider(SnackbarService),
    ],
  });

  const expectedReview = {
    environment: FeedbackEnvironment.Production,
    extra: {},
    host_u_id: 'testHostId',
    message: 'Git gud',
    page: '/storage',
    product_model: 'M40',
    product_type: ProductType.ScaleEnterprise,
    rating: 1,
    release: 'SCALE-24.04',
    user_agent: 'Safari',
  };

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

  it('uploads a new rating with relevant system information when form is submitted', async () => {
    await form.fillForm({
      'Select Rating': 1,
      Message: 'Git gud',
    });

    await submitButton.click();

    expect(feedbackService.addReview).toHaveBeenCalledWith(expectedReview);
    expect(dialogRef.close).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('takes screenshot and uploads it when corresponding checkbox is ticked', async () => {
    await form.fillForm({
      'Select Rating': 1,
      Message: 'Git gud',
      'Take screenshot of the current page': true,
    });

    await submitButton.click();

    expect(feedbackService.addReview).toHaveBeenCalledWith(expectedReview);
    expect(feedbackService.takeScreenshot).toHaveBeenCalled();
    expect(feedbackService.addReviewAttachment).toHaveBeenCalledWith(23, fakeScreenshot);
  });

  it('uploads attachments if they are added', async () => {
    const fakeAttachments = [fakeFile('attachment1.png'), fakeFile('attachment2.png')];

    await form.fillForm({
      'Select Rating': 1,
      Message: 'Git gud',
      'Take screenshot of the current page': true,
      'Attach additional images': true,
    });
    await form.fillForm({
      'Attach images (optional)': fakeAttachments,
    });

    await submitButton.click();

    expect(feedbackService.addReview).toHaveBeenCalledWith(expectedReview);
    expect(feedbackService.takeScreenshot).toHaveBeenCalled();
    expect(feedbackService.addReviewAttachment).toHaveBeenCalledTimes(3);
    expect(feedbackService.addReviewAttachment).toHaveBeenCalledWith(23, fakeScreenshot);
    expect(feedbackService.addReviewAttachment).toHaveBeenCalledWith(23, fakeAttachments[0]);
    expect(feedbackService.addReviewAttachment).toHaveBeenCalledWith(23, fakeAttachments[1]);
  });

  it('does not fail if taking a screenshot fails', async () => {
    jest.spyOn(feedbackService, 'takeScreenshot').mockImplementation(() => throwError(() => new Error('')));

    await form.fillForm({
      'Select Rating': 1,
      Message: 'Git gud',
      'Take screenshot of the current page': true,
    });

    await submitButton.click();

    expect(feedbackService.addReview).toHaveBeenCalledWith(expectedReview);
  });

  it('does not fail if adding attachment fails', async () => {
    jest.spyOn(feedbackService, 'addReviewAttachment').mockImplementation(() => throwError(() => new Error('')));

    await form.fillForm({
      'Select Rating': 1,
      Message: 'Git gud',
      'Attach additional images': true,
    });
    await form.fillForm({
      'Attach images (optional)': [fakeFile('attachment1.png')],
    });

    await submitButton.click();

    expect(feedbackService.addReview).toHaveBeenCalledWith(expectedReview);
  });
});
