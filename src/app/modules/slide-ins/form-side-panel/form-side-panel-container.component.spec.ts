/* eslint-disable max-classes-per-file */
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy, Component, computed, signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonHarness, TnIconButtonHarness, TnIconTesting, TnMenuHarness, TnMenuTesting,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import {
  FormSidePanelContainerComponent,
  SidePanelFooterAction,
  SidePanelFooterMenu,
} from 'app/modules/slide-ins/form-side-panel/form-side-panel-container.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';

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

  // Select the menu trigger by its `dots-vertical` icon — raw TestBed doesn't emit the library's
  // `data-test` attributes (only spectator's factory wires that), so we can't select by test id.
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

  readonly footerActions: SidePanelFooterAction[] = [
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
  ];

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

@Component({
  selector: 'ix-save-test-form',
  template: '<p>form body</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SaveTestFormComponent extends SidePanelForm {
  protected readonly form = new FormControl('');
  readonly canSubmit = signal(true);
  readonly requiredRoles = [Role.DatasetWrite];

  // Drives the host's "Saving…" label, which reads `isSubmitting` (not `isBusy`), so a form
  // merely loading its data never mislabels Save.
  readonly submitting = signal(false);

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
});
