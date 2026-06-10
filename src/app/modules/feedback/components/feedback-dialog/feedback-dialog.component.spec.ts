import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnButtonToggleGroupHarness, TnButtonToggleHarness, TnDialogHarness,
} from '@truenas/ui-components';
import { BehaviorSubject } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ProductType } from 'app/enums/product-type.enum';
import { OauthButtonComponent } from 'app/modules/buttons/oauth-button/oauth-button.component';
import { FeedbackDialog } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { FileReviewComponent } from 'app/modules/feedback/components/file-review/file-review.component';
import { FileTicketComponent } from 'app/modules/feedback/components/file-ticket/file-ticket.component';
import {
  FileTicketLicensedComponent,
} from 'app/modules/feedback/components/file-ticket-licensed/file-ticket-licensed.component';
import { FeedbackType } from 'app/modules/feedback/interfaces/feedback.interface';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { SystemGeneralService } from 'app/services/system-general.service';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

describe('FeedbackDialogComponent', () => {
  let spectator: Spectator<FeedbackDialog>;
  let typeButtonGroup: TnButtonToggleGroupHarness | null;
  let loader: HarnessLoader;
  let store$: MockStore;

  // The checked toggle renders a leading checkmark glyph as part of its text.
  const stripCheckmark = (label: string): string => label.replace('✓', '').trim();

  async function getTypeOptions(): Promise<string[]> {
    const toggles = await typeButtonGroup!.getToggles();
    const labels = await Promise.all(toggles.map((toggle) => toggle.getLabelText()));
    return labels.map(stripCheckmark);
  }

  async function selectType(label: string): Promise<void> {
    const toggle = await loader.getHarness(TnButtonToggleHarness.with({ label: new RegExp(label) }));
    await toggle.check();
  }

  const isReviewAllowed$ = new BehaviorSubject(false);
  const isEnterprise$ = new BehaviorSubject(false);

  const createComponent = createComponentFactory({
    component: FeedbackDialog,
    imports: [
      ReactiveFormsModule,
      CastPipe,
      FakeProgressBarComponent,
    ],
    providers: [
      mockProvider(FeedbackService, {
        checkIfReviewAllowed: () => isReviewAllowed$,
      }),
      mockProvider(SystemGeneralService),
      mockProvider(DialogRef),
      mockProvider(Router),
      mockApi([
        mockCall('support.attach_ticket_max_size', 5),
      ]),
      {
        provide: DIALOG_DATA,
        useValue: null,
      },
      provideMockStore({
        initialState: {
          systemInfo: {
            systemInfo: null,
            productType: ProductType.CommunityEdition,
            isIxHardware: false,
            buildYear: 2024,
          },
        },
      }),
    ],
  });

  async function setupTest(): Promise<void> {
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    store$ = spectator.inject(MockStore);
    isReviewAllowed$.next(true);
    isEnterprise$.next(false);
    typeButtonGroup = await loader.getHarness(TnButtonToggleGroupHarness);
  }

  describe('dialog without data provider', () => {
    beforeEach(async () => {
      spectator = createComponent();
      await setupTest();
    });

    it('shows the header', async () => {
      const dialog = await loader.getHarness(TnDialogHarness);
      expect(await dialog.getTitle()).toBe('Send Feedback');
    });

    it('keeps the legacy close-button test id', () => {
      // tn-dialog-shell scopes its close button as button-close-<testId>, matching
      // the pre-migration test id so existing Release Engineering selectors hold.
      // (The library writes data-testid by default; main.ts maps it to data-test in the app.)
      const closeButton = spectator.query('.tn-dialog__close');
      const testId = closeButton?.getAttribute('data-test') ?? closeButton?.getAttribute('data-testid');
      expect(testId).toBe('button-close-feedback-dialog');
    });

    describe('type selector', () => {
      it('shows Review and Bug on enterprise system with reviews enabled', async () => {
        isReviewAllowed$.next(true);
        isEnterprise$.next(true);

        expect(await getTypeOptions()).toEqual(['Rate this page', 'Report a bug']);
      });

      it('hides type selector when only one option is available (enterprise with reviews disabled)', async () => {
        isReviewAllowed$.next(false);
        isEnterprise$.next(true);

        typeButtonGroup = await loader.getHarnessOrNull(TnButtonToggleGroupHarness);
        expect(typeButtonGroup).toBeNull();
      });

      it('shows Review and Bug on a non-enterprise system with reviews enabled', async () => {
        isReviewAllowed$.next(true);
        isEnterprise$.next(false);

        expect(await getTypeOptions()).toEqual([
          'Rate this page',
          'Report a bug',
        ]);
      });
    });

    describe('forms', () => {
      it('shows FileReview system when Review is selected', async () => {
        isReviewAllowed$.next(true);
        await selectType('Rate this page');
        spectator.detectChanges();

        const visibleForm = spectator.query(FileReviewComponent);
        expect(visibleForm).toExist();
        // White-box read of the child's signal input: no harness exposes "which form
        // is active / what dialogRef it received", so we assert it directly.
        expect(visibleForm!.dialogRef()).toBe(spectator.inject(DialogRef));

        expect(spectator.query(FileTicketComponent)).not.toExist();
        expect(spectator.query(FileTicketLicensedComponent)).not.toExist();

        // The active form's actions are projected into the shell footer.
        const submitButton = await loader.getHarness(TnButtonHarness.with({ label: 'Submit' }));
        expect(submitButton).toBeTruthy();
      });

      it('shows FileTicket form when Bug is selected on a non-enterprise system', async () => {
        await selectType('Report a bug');
        spectator.detectChanges();

        const visibleForm = spectator.query(FileTicketComponent);
        expect(visibleForm).toExist();
        expect(visibleForm!.dialogRef()).toBe(spectator.inject(DialogRef));
        expect(visibleForm!.type()).toBe(FeedbackType.Bug);

        expect(spectator.query(FileReviewComponent)).not.toExist();
        expect(spectator.query(FileTicketLicensedComponent)).not.toExist();

        // The bug form projects its JIRA login action into the shell footer.
        expect(spectator.query(OauthButtonComponent)).toExist();
      });

      it('shows FileTicketLicensed form when Bug is selected on an enterprise system', async () => {
        isEnterprise$.next(true);
        store$.overrideSelector(selectIsEnterprise, true);
        store$.refreshState();
        spectator.detectChanges();

        await selectType('Report a bug');
        spectator.detectChanges();

        const visibleForm = spectator.query(FileTicketLicensedComponent);
        expect(visibleForm).toExist();
        expect(visibleForm!.dialogRef()).toBe(spectator.inject(DialogRef));

        expect(spectator.query(FileReviewComponent)).not.toExist();
        expect(spectator.query(FileTicketComponent)).not.toExist();

        // The licensed form projects its Submit action into the shell footer.
        const submitButton = await loader.getHarness(TnButtonHarness.with({ label: 'Submit' }));
        expect(submitButton).toBeTruthy();
      });

      it('disables dialog close when loading is set to true', async () => {
        // Reset to non-enterprise to ensure FileTicketComponent is shown
        isEnterprise$.next(false);
        store$.overrideSelector(selectIsEnterprise, false);
        store$.refreshState();
        spectator.detectChanges();

        await selectType('Report a bug');
        spectator.detectChanges();

        const visibleForm = spectator.query(FileTicketComponent);
        expect(visibleForm!.dialogRef()).toBe(spectator.inject(DialogRef));

        spectator.component.onIsLoadingChange(true);
        expect(visibleForm!.dialogRef()).toHaveProperty('disableClose', true);

        spectator.component.onIsLoadingChange(false);
        expect(visibleForm!.dialogRef()).toHaveProperty('disableClose', false);
      });
    });
  });

  it('opens a bug report form when it is requested when via dialog data when opening a dialog', async () => {
    spectator = createComponent({
      providers: [
        {
          provide: DIALOG_DATA,
          useValue: FeedbackType.Bug,
        },
      ],
    });
    await setupTest();
    isReviewAllowed$.next(true);
    store$.overrideSelector(selectIsEnterprise, false);
    store$.refreshState();
    spectator.detectChanges();

    const checkedToggle = await typeButtonGroup!.getCheckedToggle();
    expect(stripCheckmark(await checkedToggle!.getLabelText())).toBe('Report a bug');
    expect(spectator.query(FileTicketComponent)).toExist();
  });
});
