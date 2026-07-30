import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy, Component, ComponentRef, inject, input, model, output, signal,
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

  readonly title = input<string>('');
  readonly width = input<string>('480px');
  readonly testId = input<TnTestIdValue | undefined>(undefined);
  readonly saveLabel = input<string>('Save');
  /**
   * Hide the panel footer (Save + secondary actions). For hosted components that manage their own
   * actions inline — e.g. a `mat-stepper` wizard whose Next/Back/Save buttons live inside the steps.
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
