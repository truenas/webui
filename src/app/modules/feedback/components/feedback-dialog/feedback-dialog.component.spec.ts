import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { FeedbackDialogComponent } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { FileReviewComponent } from 'app/modules/feedback/components/file-review/file-review.component';
import { FileTicketComponent } from 'app/modules/feedback/components/file-ticket/file-ticket.component';
import {
  FileTicketLicensedComponent,
} from 'app/modules/feedback/components/file-ticket-licensed/file-ticket-licensed.component';
import { FeedbackType } from 'app/modules/feedback/interfaces/feedback.interface';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { IxButtonGroupHarness } from 'app/modules/forms/ix-forms/components/ix-button-group/ix-button-group.harness';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('FeedbackDialogComponent', () => {
  let spectator: Spectator<FeedbackDialogComponent>;
  let typeButtonGroup: IxButtonGroupHarness;
  let loader: HarnessLoader;

  const isReviewAllowed$ = new BehaviorSubject(false);
  const isEnterprise$ = new BehaviorSubject(false);

  const createComponent = createComponentFactory({
    component: FeedbackDialogComponent,
    imports: [
      ReactiveFormsModule,
      CastPipe,
      FakeProgressBarComponent,
    ],
    declarations: [
      MockComponents(
        FileReviewComponent,
        FileTicketComponent,
        FileTicketLicensedComponent,
      ),
    ],
    providers: [
      mockProvider(FeedbackService, {
        checkIfReviewAllowed: () => isReviewAllowed$,
      }),
      mockProvider(SystemGeneralService, { isEnterprise$ }),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: null,
      },
    ],
  });

  async function setupTest(): Promise<void> {
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    isReviewAllowed$.next(true);
    isEnterprise$.next(false);
    typeButtonGroup = await loader.getHarness(IxButtonGroupHarness);
  }

  describe('dialog without data provider', () => {
    beforeEach(async () => {
      spectator = createComponent();
      await setupTest();
    });

    it('shows the header', () => {
      expect(spectator.query('h1')).toHaveText('Send Feedback');
    });

    describe('type selector', () => {
      it('shows Review and Bug on enterprise system with reviews enabled', async () => {
        isReviewAllowed$.next(true);
        isEnterprise$.next(true);

        expect(await typeButtonGroup.getOptions()).toEqual(['Rate this page', 'Report a bug']);
      });

      it('hides type selector when only one option is available (enterprise with reviews disabled)', async () => {
        isReviewAllowed$.next(false);
        isEnterprise$.next(true);

        typeButtonGroup = await loader.getHarnessOrNull(IxButtonGroupHarness.with({ label: 'I would like to' }));
        expect(typeButtonGroup).toBeNull();
      });

      it('shows Review and Bug on a non-enterprise system with reviews enabled', async () => {
        isReviewAllowed$.next(true);
        isEnterprise$.next(false);

        expect(await typeButtonGroup.getOptions()).toEqual([
          'Rate this page',
          'Report a bug',
        ]);
      });
    });

    describe('forms', () => {
      it('shows FileReview system when Review is selected', async () => {
        isReviewAllowed$.next(true);
        await typeButtonGroup.setValue('Rate this page');
        spectator.detectChanges();

        const visibleForm = spectator.query(FileReviewComponent);
        expect(visibleForm).toExist();
        expect(visibleForm.dialogRef).toBe(spectator.inject(MatDialogRef));

        expect(spectator.query(FileTicketComponent)).not.toExist();
        expect(spectator.query(FileTicketLicensedComponent)).not.toExist();
      });

      it('shows FileTicket form when Bug is selected on a non-enterprise system', async () => {
        await typeButtonGroup.setValue('Report a bug');
        spectator.detectChanges();

        let visibleForm = spectator.query(FileTicketComponent);
        expect(visibleForm).toExist();
        expect(visibleForm.dialogRef).toBe(spectator.inject(MatDialogRef));
        expect(visibleForm.type).toBe(FeedbackType.Bug);

        expect(spectator.query(FileReviewComponent)).not.toExist();
        expect(spectator.query(FileTicketLicensedComponent)).not.toExist();

        visibleForm = spectator.query(FileTicketComponent);
        expect(visibleForm).toExist();
        expect(visibleForm.dialogRef).toBe(spectator.inject(MatDialogRef));
        expect(visibleForm.type).toBe(FeedbackType.Bug);

        expect(spectator.query(FileReviewComponent)).not.toExist();
        expect(spectator.query(FileTicketLicensedComponent)).not.toExist();
      });

      it('shows FileTicketLicensed form when Bug is selected on an enterprise system', async () => {
        isEnterprise$.next(true);

        await typeButtonGroup.setValue('Report a bug');
        spectator.detectChanges();

        const visibleForm = spectator.query(FileTicketLicensedComponent);
        expect(visibleForm).toExist();
        expect(visibleForm.dialogRef).toBe(spectator.inject(MatDialogRef));

        expect(spectator.query(FileReviewComponent)).not.toExist();
        expect(spectator.query(FileTicketComponent)).not.toExist();
      });

      it('disables dialog close when loading is set to true', async () => {
        await typeButtonGroup.setValue('Report a bug');
        spectator.detectChanges();

        const visibleForm = spectator.query(FileTicketComponent);
        expect(visibleForm.dialogRef).toBe(spectator.inject(MatDialogRef));

        spectator.component.onIsLoadingChange(true);
        expect(visibleForm.dialogRef).toHaveProperty('disableClose', true);

        spectator.component.onIsLoadingChange(false);
        expect(visibleForm.dialogRef).toHaveProperty('disableClose', false);
      });
    });
  });

  it('opens a bug report form when it is requested when via dialog data when opening a dialog', async () => {
    spectator = createComponent({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: FeedbackType.Bug,
        },
      ],
    });
    await setupTest();
    isReviewAllowed$.next(true);

    expect(await typeButtonGroup.getValue()).toBe('Report a bug');
    expect(spectator.query(FileTicketComponent)).toExist();
  });
});
