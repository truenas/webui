/* eslint-disable max-classes-per-file */
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy, Component, computed, signal,
} from '@angular/core';
import {
  ComponentFixture, fakeAsync, TestBed, tick,
} from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnBannerHarness, TnButtonHarness, TnIconButtonHarness, TnIconTesting, TnMenuHarness, TnMenuTesting,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  defaultMinSubmitFeedbackMs, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import {
  FormSidePanelContainerComponent,
} from 'app/modules/slide-ins/form-side-panel/form-side-panel-container.component';
import {
  advancedModeFooterAction,
  SidePanelFooterAction,
  SidePanelFooterMenu,
} from 'app/modules/slide-ins/form-side-panel/side-panel-footer-actions';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';

/**
 * The footer Save. `tnSidePanelAction` sits directly on it in the container template, while
 * `footerActions` / `footerMenu` buttons sit inside a wrapper carrying the directive — so this
 * matches Save and only Save, no matter what else the footer holds.
 */
const saveButtonSelector = 'tn-button[tnSidePanelAction]';

const privateKeyClick = jest.fn();
const publicKeyClick = jest.fn();

@Component({
  selector: 'ix-menu-test-form',
  template: '<p>form body</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MenuTestFormComponent extends SidePanelForm {
  protected readonly form = new FormControl('');
  readonly canSubmit = signal(true);

  // The Private Key item is disabled until this flips — mirrors the real form's
  // signal-driven `disabled` predicate so we can assert reactive enabling.
  readonly privateKeyReady = signal(false);

  readonly footerMenu = computed<SidePanelFooterMenu>(() => ({
    label: 'Download',
    testId: 'download-actions',
    items: [
      {
        label: 'Download Private Key',
        testId: 'download-private-key',
        disabled: () => !this.privateKeyReady(),
        onClick: () => privateKeyClick(),
      },
      {
        label: 'Download Public Key',
        testId: 'download-public-key',
        onClick: () => publicKeyClick(),
      },
    ],
  }));

  protected onSubmit(): void {
    this.close(true);
  }
}

describe('FormSidePanelContainerComponent footer menu', () => {
  let fixture: ComponentFixture<FormSidePanelContainerComponent>;

  const getForm = (): MenuTestFormComponent => fixture.debugElement.query(
    (node) => node.componentInstance instanceof MenuTestFormComponent,
  ).componentInstance as MenuTestFormComponent;

  // Selected by its `dots-vertical` icon: TnIconButtonHarness filters on the icon, not on a test id.
  const getTrigger = (): Promise<TnIconButtonHarness> => TnMenuTesting.rootLoader(fixture)
    .getHarness(TnIconButtonHarness.with({ name: 'dots-vertical', library: 'mdi' }));

  const openMenu = async (): Promise<TnMenuHarness> => {
    await (await getTrigger()).click();
    return TnMenuTesting.rootLoader(fixture).getHarness(TnMenuHarness);
  };

  beforeEach(() => {
    privateKeyClick.mockClear();
    publicKeyClick.mockClear();

    TestBed.configureTestingModule({
      imports: [FormSidePanelContainerComponent, MenuTestFormComponent, TranslateModule.forRoot()],
      providers: [
        mockAuth(),
        {
          provide: UnsavedChangesService,
          useValue: { showConfirmDialog: jest.fn(() => of(true)) },
        },
        ...TnIconTesting.jest.providers(),
      ],
    });

    fixture = TestBed.createComponent(FormSidePanelContainerComponent);
    fixture.componentRef.setInput('portal', new ComponentPortal(MenuTestFormComponent));
    // A panel without a title has no accessible name, which the library warns about in
    // dev mode; production callers always pass one.
    fixture.componentRef.setInput('title', 'Footer Menu Form');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  });

  it('renders the footer menu trigger with the translated label as its accessible name', async () => {
    // Confirms the trigger resolves (by its dots-vertical icon) and the label reached the DOM as
    // an accessible name — the icon-button projects `[ariaLabel]` onto its inner <button>.
    await getTrigger();
    const ariaLabels = Array.from(document.querySelectorAll('[aria-label]'))
      .map((element) => element.getAttribute('aria-label'));

    expect(ariaLabels).toContain('Download');
  });

  it('lists every footer-menu item once the trigger is opened', async () => {
    const menu = await openMenu();

    expect(await menu.getItemLabels()).toEqual(['Download Private Key', 'Download Public Key']);
  });

  it('reflects each item\'s reactive disabled predicate', async () => {
    const menu = await openMenu();
    expect(await menu.isItemDisabled({ label: 'Download Private Key' })).toBe(true);
    expect(await menu.isItemDisabled({ label: 'Download Public Key' })).toBe(false);

    // The `disabled` predicate is re-evaluated each change detection — flipping the signal while
    // the menu stays open should reactively enable the item.
    getForm().privateKeyReady.set(true);
    fixture.detectChanges();

    expect(await menu.isItemDisabled({ label: 'Download Private Key' })).toBe(false);
  });

  it('invokes the item onClick handler when an enabled item is clicked', async () => {
    const menu = await openMenu();
    await menu.clickItem({ label: 'Download Public Key' });

    expect(publicKeyClick).toHaveBeenCalled();
    expect(privateKeyClick).not.toHaveBeenCalled();
  });
});

const backClick = jest.fn();
const nextClick = jest.fn();
const retryLoadSpy = jest.fn();

@Component({
  selector: 'ix-actions-test-form',
  template: '<p>form body</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ActionsTestFormComponent extends SidePanelForm {
  protected readonly form = new FormControl('');
  readonly canSubmit = signal(true);

  // Next is disabled until this flips — mirrors the iscsi wizard's step-validity
  // predicate so we can assert the container re-evaluates `disabled` reactively.
  readonly nextReady = signal(false);

  readonly isAdvancedMode = signal(false);
  // Signal-backed action, the shape `advancedModeFooterAction` produces — asserts the container
  // re-reads `footerActions` so a label change reaches the rendered button.
  private readonly advancedToggle = advancedModeFooterAction(this.isAdvancedMode);

  // The load-failure surface `IxFormHostForm` exposes; here driven directly so the container's
  // banner can be asserted without an inner `<ix-form>`.
  readonly loadFailed = signal(false);

  hasLoadFailed(): boolean {
    return this.loadFailed();
  }

  retryLoad(): void {
    retryLoadSpy();
    this.loadFailed.set(false);
  }

  get footerActions(): SidePanelFooterAction[] {
    return [
      {
        label: 'Back',
        testId: 'back',
        onClick: () => backClick(),
      },
      {
        label: 'Next',
        testId: 'next',
        color: 'primary',
        disabled: () => !this.nextReady(),
        onClick: () => nextClick(),
      },
      ...this.advancedToggle(),
    ];
  }

  protected onSubmit(): void {
    this.close(true);
  }
}

describe('FormSidePanelContainerComponent footer actions', () => {
  let fixture: ComponentFixture<FormSidePanelContainerComponent>;

  const getForm = (): ActionsTestFormComponent => fixture.debugElement.query(
    (node) => node.componentInstance instanceof ActionsTestFormComponent,
  ).componentInstance as ActionsTestFormComponent;

  beforeEach(() => {
    backClick.mockClear();
    nextClick.mockClear();
    retryLoadSpy.mockClear();

    TestBed.configureTestingModule({
      imports: [FormSidePanelContainerComponent, ActionsTestFormComponent, TranslateModule.forRoot()],
      providers: [
        mockAuth(),
        {
          provide: UnsavedChangesService,
          useValue: { showConfirmDialog: jest.fn(() => of(true)) },
        },
        ...TnIconTesting.jest.providers(),
      ],
    });

    fixture = TestBed.createComponent(FormSidePanelContainerComponent);
    fixture.componentRef.setInput('portal', new ComponentPortal(ActionsTestFormComponent));
    // A panel without a title has no accessible name, which the library warns about in
    // dev mode; production callers always pass one.
    fixture.componentRef.setInput('title', 'Footer Actions Form');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  });

  it('renders each footerActions entry as a footer button', async () => {
    const loader = TnMenuTesting.rootLoader(fixture);

    const backButton = await loader.getHarness(TnButtonHarness.with({ label: 'Back' }));
    const nextButton = await loader.getHarness(TnButtonHarness.with({ label: 'Next' }));

    expect(await backButton.isDisabled()).toBe(false);
    expect(await nextButton.isDisabled()).toBe(true);
  });

  it('re-renders an action label when the signal behind it flips', async () => {
    const loader = TnMenuTesting.rootLoader(fixture);
    const toggle = await loader.getHarness(TnButtonHarness.with({ label: 'Advanced Options' }));

    await toggle.click();
    fixture.detectChanges();

    expect(await toggle.getLabel()).toBe('Basic Options');
    expect(getForm().isAdvancedMode()).toBe(true);
  });

  // TnButtonHarness exposes no aria-label getter, and the attribute sits on the <button>
  // tn-button renders rather than on its host element — so read it off the DOM.
  const footerActionAriaLabel = (label: string): string | null => {
    const host = Array.from(document.querySelectorAll('tn-button'))
      .find((element) => element.textContent?.trim() === label);
    return host?.querySelector('button')?.getAttribute('aria-label') ?? null;
  };

  it('renders the action ariaLabel so a footer toggle announces what it will do', async () => {
    const loader = TnMenuTesting.rootLoader(fixture);
    const toggle = await loader.getHarness(TnButtonHarness.with({ label: 'Advanced Options' }));

    expect(footerActionAriaLabel('Advanced Options')).toBe('Show Advanced Options');

    await toggle.click();
    fixture.detectChanges();

    expect(footerActionAriaLabel('Basic Options')).toBe('Show Basic Options');
  });

  it('leaves aria-label off actions that do not declare one', () => {
    expect(footerActionAriaLabel('Next')).toBeNull();
  });

  describe('failed initial load', () => {
    it('shows no banner while the form loaded fine', async () => {
      const loader = TnMenuTesting.rootLoader(fixture);

      expect(await loader.getAllHarnesses(TnBannerHarness)).toHaveLength(0);
    });

    it('explains the failure and offers a retry once the form reports one', async () => {
      getForm().loadFailed.set(true);
      fixture.detectChanges();

      const loader = TnMenuTesting.rootLoader(fixture);
      const banner = await loader.getHarness(TnBannerHarness);
      expect(await banner.getText()).toContain('Settings could not be loaded');

      const retryButton = await loader.getHarness(TnButtonHarness.with({ label: 'Retry' }));
      await retryButton.click();
      fixture.detectChanges();

      expect(retryLoadSpy).toHaveBeenCalled();
      // A successful retry clears the flag, so the banner goes away.
      expect(await loader.getAllHarnesses(TnBannerHarness)).toHaveLength(0);
    });
  });

  it('re-evaluates the reactive disabled predicate and invokes onClick', async () => {
    const loader = TnMenuTesting.rootLoader(fixture);
    const nextButton = await loader.getHarness(TnButtonHarness.with({ label: 'Next' }));

    getForm().nextReady.set(true);
    fixture.detectChanges();
    expect(await nextButton.isDisabled()).toBe(false);

    await nextButton.click();
    expect(nextClick).toHaveBeenCalled();
    expect(backClick).not.toHaveBeenCalled();
  });
});

const saveSubmit = jest.fn();

/**
 * Minimal hosted form exposing the two signals the footer Save reads. Mirrors what
 * `IxFormHostForm` delegates to its inner `<ix-form>`: `isSubmitting` labels the button,
 * `isBusy` (which also covers an initial data load) only disables it.
 */
@Component({
  selector: 'ix-save-test-form',
  template: '<p>form body</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SaveTestFormComponent extends SidePanelForm {
  protected readonly form = new FormControl('');
  readonly canSubmit = signal(true);
  readonly requiredRoles = [Role.DatasetWrite];

  readonly busy = signal(false);

  // Drives the host's "Saving…" label, which reads `isSubmitting` (not `isBusy`), so a form
  // merely loading its data never mislabels Save.
  readonly submitting = signal(false);

  override isBusy(): boolean {
    return this.busy();
  }

  override readonly isSubmitting = computed(() => this.submitting());

  override submit(): void {
    saveSubmit();
  }

  protected onSubmit(): void {
    this.close(true);
  }
}

describe('FormSidePanelContainerComponent footer Save', () => {
  let fixture: ComponentFixture<FormSidePanelContainerComponent>;

  const getForm = (): SaveTestFormComponent => fixture.debugElement.query(
    (node) => node.componentInstance instanceof SaveTestFormComponent,
  ).componentInstance as SaveTestFormComponent;

  // Document-root loader: tn-side-panel renders its panel (footer included) outside the fixture.
  const getSaveButton = (): Promise<TnButtonHarness> => TnMenuTesting.rootLoader(fixture)
    .getHarness(TnButtonHarness.with({ selector: saveButtonSelector }));

  /**
   * `MockAuthService.hasRole` is a hardcoded `of(true)`, so `*ixRequiresRoles` can only be
   * exercised by overriding it before the container (and its footer) first renders.
   */
  const setUp = (hasRequiredRole = true): void => {
    TestBed.configureTestingModule({
      imports: [FormSidePanelContainerComponent, SaveTestFormComponent, TranslateModule.forRoot()],
      providers: [
        mockAuth(),
        {
          provide: UnsavedChangesService,
          useValue: { showConfirmDialog: jest.fn(() => of(true)) },
        },
        ...TnIconTesting.jest.providers(),
      ],
    });

    const authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    authService.hasRole.mockReturnValue(of(hasRequiredRole));

    fixture = TestBed.createComponent(FormSidePanelContainerComponent);
    fixture.componentRef.setInput('portal', new ComponentPortal(SaveTestFormComponent));
    // A panel without a title has no accessible name, which the library warns about in
    // dev mode; production callers always pass one.
    fixture.componentRef.setInput('title', 'Footer Save Form');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  };

  beforeEach(() => {
    saveSubmit.mockClear();
  });

  it('renders a Save button that submits the hosted form', async () => {
    setUp();
    const saveButton = await TnMenuTesting.rootLoader(fixture).getHarness(TnButtonHarness.with({ label: 'Save' }));

    expect(await saveButton.isDisabled()).toBe(false);

    await saveButton.click();
    expect(saveSubmit).toHaveBeenCalled();
  });

  it('disables Save while the hosted form reports it cannot submit', async () => {
    setUp();
    const saveButton = await TnMenuTesting.rootLoader(fixture).getHarness(TnButtonHarness.with({ label: 'Save' }));

    getForm().canSubmit.set(false);
    fixture.detectChanges();

    expect(await saveButton.isDisabled()).toBe(true);
  });

  it('switches Save to Saving… while a save is in flight', async () => {
    setUp();
    const loader = TnMenuTesting.rootLoader(fixture);

    getForm().submitting.set(true);
    fixture.detectChanges();

    expect(await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Save' }))).toBeNull();
    expect(await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Saving…' }))).not.toBeNull();
  });

  it('gates Save behind the missing-access wrapper for a user lacking the requiredRoles', async () => {
    setUp(false);

    // `*ixRequiresRoles` doesn't remove the button — it wraps it, disabling its focusable
    // elements and explaining why via a tooltip. Assert the wrapper, not an absent button.
    expect(document.querySelector('ix-missing-access-wrapper')).not.toBeNull();

    const saveButton = await TnMenuTesting.rootLoader(fixture)
      .getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();
    expect(saveSubmit).not.toHaveBeenCalled();
  });

  it('renders Save unwrapped for a user holding the requiredRoles', () => {
    setUp();

    expect(document.querySelector('ix-missing-access-wrapper')).toBeNull();
  });

  // The distinction IxFormHostForm.isSubmitting() exists for: a form fetching its initial config
  // is busy (Save disabled) but is not saving, so the label must stay "Save".
  it('keeps the Save label while merely busy, and disables it', async () => {
    setUp();
    getForm().busy.set(true);
    fixture.detectChanges();

    const save = await getSaveButton();

    expect(await save.getLabel()).toBe('Save');
    expect(await save.isDisabled()).toBe(true);
  });
});

/**
 * Hosted form wrapping a REAL `<ix-form>`, so the footer Save reads the submitting state the
 * production wrapper actually produces rather than a hand-driven signal.
 */
@Component({
  selector: 'ix-hosted-ix-form',
  template: '<ix-form [formGroup]="form" [submitHandler]="handleSubmit" (closed)="closed.emit($event)"></ix-form>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormComponent],
})
class HostedIxFormComponent extends IxFormHostForm {
  // No controls: an empty group is VALID, so Save is enabled from the start.
  protected readonly form = new FormGroup({});

  // Resolves synchronously — the only thing keeping the submit in flight is the feedback hold.
  protected handleSubmit = (): SubmitResult => ({
    request$: of({ id: 1 }),
    successMessage: 'Saved!' as TranslatedString,
  });
}

/**
 * The footer Save label lives here, but the state behind it is produced by `<ix-form>` — and
 * `ixFormTestingProviders()` zeroes the minimum-submit-feedback hold for every other spec. This one
 * keeps the production hold so the "Saving…" swap is pinned against real timing: a save that
 * resolves instantly must still hold the label up for the hold's duration and drop it right after.
 */
describe('FormSidePanelContainerComponent footer Save with a real <ix-form>', () => {
  let fixture: ComponentFixture<FormSidePanelContainerComponent>;

  const getForm = (): HostedIxFormComponent => fixture.debugElement.query(
    (node) => node.componentInstance instanceof HostedIxFormComponent,
  ).componentInstance as HostedIxFormComponent;

  // Read from the DOM rather than through a harness: harness calls await zone stability, which the
  // pending hold timer would block until it has already fired — exactly the window under test.
  // Queried from `document` because tn-side-panel renders its panel outside the fixture's host, and
  // addressed by `saveButtonSelector` so a second footer button can't shift what is read.
  const getSaveLabel = (): string => document.querySelector(saveButtonSelector)?.textContent?.trim() ?? '';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormSidePanelContainerComponent, HostedIxFormComponent, TranslateModule.forRoot()],
      providers: [
        mockAuth(),
        // The hold is the point of this suite; everywhere else it is zeroed.
        ...ixFormTestingProviders({ realSubmitFeedback: true }),
        {
          provide: UnsavedChangesService,
          useValue: { showConfirmDialog: jest.fn(() => of(true)) },
        },
        ...TnIconTesting.jest.providers(),
      ],
    });

    fixture = TestBed.createComponent(FormSidePanelContainerComponent);
    fixture.componentRef.setInput('portal', new ComponentPortal(HostedIxFormComponent));
    // A panel without a title has no accessible name, which the library warns about in
    // dev mode; production callers always pass one.
    fixture.componentRef.setInput('title', 'Hosted Form');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  });

  it('shows Saving… for as long as the production feedback hold runs', fakeAsync(() => {
    expect(getSaveLabel()).toBe('Save');

    getForm().submit();
    fixture.detectChanges();

    expect(getSaveLabel()).toBe('Saving…');

    tick(defaultMinSubmitFeedbackMs - 1);
    fixture.detectChanges();
    expect(getSaveLabel()).toBe('Saving…');

    tick(1);
    fixture.detectChanges();
    expect(getSaveLabel()).toBe('Save');
  }));
});
