import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy, Component, ComponentRef, inject, input, model, output, signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnIconButtonComponent,
  TnMenuComponent,
  TnMenuItemComponent,
  TnMenuTriggerDirective,
  TnSidePanelActionDirective,
  TnSidePanelComponent,
  type TnTestIdValue,
} from '@truenas/ui-components';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';

/**
 * A secondary action rendered in the side-panel footer alongside the built-in Save (e.g. a form's
 * "Send Test Alert"). Listed in {@link HostedSidePanelForm.footerActions}; the container renders one
 * `tn-button` per entry, before Save.
 */
export interface SidePanelFooterAction {
  /** Untranslated marker; the container pipes it through `translate`. */
  label: string;
  testId: TnTestIdValue;
  /** `tn-button` color; defaults to `'default'` (secondary). */
  color?: 'primary' | 'secondary' | 'warn' | 'default';
  /** Roles required to show the action (omit / empty = always shown). */
  requiredRoles?: Role[];
  /** Re-evaluated each change detection — read signals inside for reactive disabling. */
  disabled?: () => boolean;
  onClick: () => void;
}

/** A single action inside a {@link SidePanelFooterMenu}. */
export interface SidePanelFooterMenuItem {
  /** Untranslated marker; the container pipes it through `translate`. */
  label: string;
  testId: TnTestIdValue;
  icon?: string;
  iconLibrary?: 'material' | 'mdi' | 'custom' | 'lucide';
  /** Roles required to show the item (omit / empty = always shown). */
  requiredRoles?: Role[];
  /** Re-evaluated each change detection — read signals inside for reactive disabling. */
  disabled?: () => boolean;
  onClick: () => void;
}

/**
 * A dropdown of secondary actions rendered in the footer before Save. Use instead of a flat
 * {@link SidePanelFooterAction}[] when several actions would crowd the footer — the container
 * renders one `dots-vertical` icon-button trigger opening a `tn-menu` of the {@link items}.
 */
export interface SidePanelFooterMenu {
  /** Trigger button accessible name / tooltip (untranslated marker). */
  label: string;
  testId: TnTestIdValue;
  items: SidePanelFooterMenuItem[];
}

/**
 * A {@link SidePanelForm} that may expose `requiredRoles` to gate its Save action, plus optional
 * {@link SidePanelFooterAction}s and/or a {@link SidePanelFooterMenu} rendered before Save. Forms
 * declare these independently (not on the base), so the host reads them through this structural
 * augmentation rather than forcing every form to `override` a base member.
 */
export type HostedSidePanelForm = SidePanelForm & {
  readonly requiredRoles?: Role[];
  readonly footerActions?: SidePanelFooterAction[];
  readonly footerMenu?: SidePanelFooterMenu;
};

/**
 * Internal chrome for {@link FormSidePanelService}. Not used directly in templates — the
 * service instantiates it dynamically, portals a {@link SidePanelForm} into it, and reads
 * back the attached instance to wire the Save action and the unsaved-changes close guard.
 *
 * Keeping this declarative (rather than composing `tn-side-panel` by hand in the service)
 * lets Angular own change detection, the `[tnSidePanelAction]` projection, and `cdkTrapFocus`.
 */
@Component({
  selector: 'ix-form-side-panel-container',
  templateUrl: './form-side-panel-container.component.html',
  // `display: contents` dissolves the secondary-actions wrapper box so its buttons flex directly
  // in the panel footer alongside Save (the wrapper exists only to project the group as one node).
  styles: ['.footer-actions-group { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    TnButtonComponent,
    TnIconButtonComponent,
    TnMenuComponent,
    TnMenuItemComponent,
    TnMenuTriggerDirective,
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
  readonly portal = input<ComponentPortal<SidePanelForm> | null>(null);
  /** Inputs applied to the hosted form before its first change detection (before `ngOnInit`). */
  readonly formInputs = input<Record<string, unknown>>({});
  readonly open = model<boolean>(false);

  /** The hosted form, resolved once the portal attaches. Drives Save + close guard. */
  protected readonly form = signal<HostedSidePanelForm | null>(null);

  /** Emitted with the form instance once the portal has attached it. */
  readonly formAttached = output<SidePanelForm>();
  /** Emitted after the panel has fully transitioned closed (user dismiss or programmatic). */
  readonly panelClosed = output();

  protected readonly closeGuard = (): Observable<boolean> => {
    return this.form()?.hasUnsavedChanges()
      ? this.unsavedChanges.showConfirmDialog()
      : of(true);
  };

  protected onPortalAttached(ref: unknown): void {
    const componentRef = ref as ComponentRef<SidePanelForm> | null;
    if (!componentRef?.instance) {
      return;
    }
    // Runs synchronously on portal attach, before the form's first CD — so inputs are in
    // place when its `ngOnInit` reads them.
    const inputs = this.formInputs();
    for (const key of Object.keys(inputs)) {
      componentRef.setInput(key, inputs[key]);
    }
    this.form.set(componentRef.instance);
    this.formAttached.emit(componentRef.instance);
  }
}
