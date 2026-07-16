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
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
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
