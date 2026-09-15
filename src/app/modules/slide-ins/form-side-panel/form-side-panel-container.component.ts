import { OverlayContainer } from '@angular/cdk/overlay';
import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, ComponentRef, ElementRef, afterNextRender, inject, input, model, output, signal,
  type Signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnBannerActionDirective,
  TnBannerComponent,
  TnButtonComponent,
  TnIconButtonComponent,
  TnMenuComponent,
  TnMenuItemComponent,
  TnMenuTriggerDirective,
  TnProgressBarComponent,
  TnSidePanelActionDirective,
  TnSidePanelComponent,
  type TnTestIdValue,
} from '@truenas/ui-components';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import {
  SidePanelFooterAction, SidePanelFooterMenu,
} from 'app/modules/slide-ins/form-side-panel/side-panel-footer-actions';
import { SidePanelHostCloseable, SidePanelHostForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';

/**
 * A {@link SidePanelHostForm} that may expose `requiredRoles` to gate its Save action, plus optional
 * {@link SidePanelFooterAction}s and/or a {@link SidePanelFooterMenu} rendered before Save. Forms
 * declare these independently (not on the base), so the host reads them through this structural
 * augmentation rather than forcing every form to `override` a base member.
 */
export type HostedSidePanelForm = SidePanelHostForm & {
  readonly requiredRoles?: Role[];
  readonly footerActions?: SidePanelFooterAction[];
  /** Read as a signal so the container re-reads it (label/items) reactively without churning a getter. */
  readonly footerMenu?: Signal<SidePanelFooterMenu>;
  /**
   * Whether the host should hide its footer Save entirely — e.g. a wizard whose earlier steps
   * offer only Next, so a (disabled) Save wouldn't be actionable anyway. Re-evaluated each change
   * detection — read signals inside for reactive hiding. Optional; absent = Save always shown.
   */
  readonly hideSave?: () => boolean;
  /**
   * Whether the form is currently busy. The host shows an indeterminate progress bar at the top of
   * the panel while true and keeps Save disabled. Optional — forms that don't expose it simply never
   * show the bar.
   */
  readonly isBusy?: () => boolean;
  /**
   * Whether a save is actually in flight (as opposed to an initial data load). The host reads this —
   * not `isBusy` — to switch Save to "Saving…", so a load never mislabels Save. Optional.
   */
  readonly isSubmitting?: () => boolean;
  /**
   * Whether the form's initial data load failed, leaving it on defaults the user never saw. The
   * host renders a banner saying so, because the form's own one-shot error modal is gone as soon
   * as it is dismissed and a greyed-out Save alone doesn't explain itself. Optional.
   */
  readonly hasLoadFailed?: () => boolean;
  /**
   * Re-runs the failed load. Paired with {@link hasLoadFailed} — the banner only offers Retry when
   * a form exposes this. Optional.
   */
  readonly retryLoad?: () => void;
};

/**
 * Internal chrome for {@link FormSidePanelService}. Not used directly in templates — the
 * service instantiates it dynamically, portals a {@link SidePanelHostForm} into it, and reads
 * back the attached instance to wire the Save action and the unsaved-changes close guard.
 *
 * Keeping this declarative (rather than composing `tn-side-panel` by hand in the service)
 * lets Angular own change detection, the `[tnSidePanelAction]` projection, and `cdkTrapFocus`.
 */
@Component({
  selector: 'ix-form-side-panel-container',
  templateUrl: './form-side-panel-container.component.html',
  styleUrls: ['./form-side-panel-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    TnBannerComponent,
    TnBannerActionDirective,
    TnButtonComponent,
    TnIconButtonComponent,
    TnMenuComponent,
    TnMenuItemComponent,
    TnMenuTriggerDirective,
    TnProgressBarComponent,
    RequiresRolesDirective,
    CdkPortalOutlet,
    TranslateModule,
  ],
})
export class FormSidePanelContainerComponent {
  private unsavedChanges = inject(UnsavedChangesService);
  /**
   * Resolved eagerly, not inside the render-phase callback below: `getContainerElement()` creates
   * the container element on first call, so taking it here leaves that callback with a single DOM
   * write (the move itself).
   */
  private cdkOverlayContainer = inject(OverlayContainer).getContainerElement();
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private document = inject(DOCUMENT);

  readonly title = input<string>('');
  readonly width = input<string>('480px');
  readonly testId = input<TnTestIdValue | undefined>(undefined);
  readonly saveLabel = input<string>('Save');
  /**
   * Hide the panel footer (Save + secondary actions). For hosted components that manage their own
   * actions inline — e.g. a `tn-stepper` wizard whose Next/Back/Save buttons live inside the steps.
   */
  readonly footerless = input<boolean>(false);
  readonly portal = input<ComponentPortal<SidePanelHostCloseable> | null>(null);
  /** Inputs applied to the hosted form before its first change detection (before `ngOnInit`). */
  readonly formInputs = input<Record<string, unknown>>({});
  readonly open = model<boolean>(false);

  /** The hosted form, resolved once the portal attaches. Drives Save + close guard. */
  protected readonly form = signal<HostedSidePanelForm | null>(null);

  /** Emitted with the form instance once the portal has attached it. */
  readonly formAttached = output<SidePanelHostCloseable>();
  /** Emitted after the panel has fully transitioned closed (user dismiss or programmatic). */
  readonly panelClosed = output();

  protected readonly closeGuard = (): Observable<boolean> => {
    return this.form()?.hasUnsavedChanges()
      ? this.unsavedChanges.showConfirmDialog()
      : of(true);
  };

  constructor() {
    // `tn-side-panel` portals its overlay to `document.body` in an `afterNextRender` of its own,
    // which runs in the default `mixedReadWrite` phase; registering ours in the later `read` phase
    // puts us after it in the same render cycle, so the element is always there to move.
    //
    // The callback does write to the DOM, which `read` nominally asks it not to. No phase offers
    // both "after the library's move" and "may write", and ordering is the load-bearing half:
    // running before the portal lands leaves nothing to re-home at all.
    afterNextRender({ read: () => this.moveOverlayIntoCdkContainer() });
  }

  /**
   * Re-homes the panel's portaled overlay from `document.body` into the CDK overlay container, so
   * that panel and CDK overlays share one stacking context and the LAST one opened paints on top.
   *
   * As body siblings they cannot: the container is one element with one `z-index`, so whichever
   * value `.tn-side-panel__overlay` takes decides the order for every CDK overlay at once. At the
   * library's own `1000` the panel (later in the body) beat dropdowns and confirm dialogs opened
   * from inside it; the `999` override in `_tn-styles.scss` fixed those but buried the panel under
   * any dialog that was already open — which is how "Manage Hosts → Edit" opened the host form
   * behind the dialog's backdrop, invisible and click-blocked (NAS-143761).
   *
   * Inside the container both sit at `z-index: 1000` (see the scoped rule in `_tn-styles.scss`)
   * and DOM order arbitrates, which is exactly "last opened wins" in both directions.
   *
   * This covers every side panel in the app — `src/app` holds no `<tn-side-panel>` element outside
   * this component's own template, so they all arrive through {@link FormSidePanelService}.
   *
   * One a11y consequence of no longer being a body sibling: CDK's `Dialog` sweeps `aria-hidden`
   * onto the container's SIBLINGS when a modal opens, so it no longer hides an open panel behind a
   * dialog stacked above it (e.g. the unsaved-changes confirm). Tab is still held by the panel's
   * focus trap, so this is browse-mode only, and it puts the panel on the same footing as every
   * other CDK overlay with a dialog on top — which is the point of the move.
   */
  private moveOverlayIntoCdkContainer(): void {
    // The overlay leaves the component's own subtree, but `tn-side-panel`'s host element stays
    // behind carrying the same `data-tn-panel` id — the correlation the library documents for it.
    const panelId = this.elementRef.nativeElement.querySelector('tn-side-panel')?.getAttribute('data-tn-panel');
    if (!panelId) {
      return;
    }

    const overlay = this.document.querySelector(`.tn-side-panel__overlay[data-tn-panel="${panelId}"]`);
    if (overlay) {
      // `appendChild` moves the element. This runs before the service flips `open` (two animation
      // frames later), so the panel still animates in from its closed, off-screen state.
      this.cdkOverlayContainer.appendChild(overlay);
    }
  }

  protected onPortalAttached(ref: unknown): void {
    const componentRef = ref as ComponentRef<SidePanelHostCloseable> | null;
    if (!componentRef?.instance) {
      return;
    }
    // Runs synchronously on portal attach, before the form's first CD — so inputs are in
    // place when its `ngOnInit` reads them.
    const inputs = this.formInputs();
    for (const key of Object.keys(inputs)) {
      componentRef.setInput(key, inputs[key]);
    }
    // The container is the one place that knows the footer surface (canSubmit/submit) is optional:
    // it reads those only behind `!footerless()`. Widen to the footer-aware view here so the
    // template can, while footerless wizards (which expose only the closeable surface) stay safe.
    this.form.set(componentRef.instance as HostedSidePanelForm);
    this.formAttached.emit(componentRef.instance);
  }
}
