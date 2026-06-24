import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy, Component, ComponentRef, inject, input, model, output, signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
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
 * A {@link SidePanelForm} that may expose `requiredRoles` to gate its Save action. Forms declare
 * this independently (not on the base), so the host reads it through this structural augmentation
 * rather than forcing every form to `override` a base member.
 */
export type HostedSidePanelForm = SidePanelForm & { readonly requiredRoles?: Role[] };

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    TnButtonComponent,
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
