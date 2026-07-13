import {
  ChangeDetectionStrategy, Component, computed, viewChild,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Role } from 'app/enums/role.enum';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import {
  BaseNamespaceFormComponent,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/base-namespace-form.component';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';

@Component({
  selector: 'ix-add-subsystem-namespace',
  templateUrl: './add-subsystem-namespace.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BaseNamespaceFormComponent,
  ],
})
export class AddSubsystemNamespaceComponent extends SidePanelForm<NamespaceChanges> {
  private baseForm = viewChild(BaseNamespaceFormComponent);

  /** Gates the host-rendered footer Save. */
  readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  readonly canSubmit = computed(() => this.baseForm()?.canSubmit() ?? false);

  /** The form lives in the projected base form; only read through the guarded overrides below. */
  protected get form(): Pick<AbstractControl, 'dirty' | 'status' | 'statusChanges'> {
    return this.baseForm()?.form;
  }

  /** Host hook (tn-side-panel closeGuard) to confirm before discarding unsaved edits. */
  override hasUnsavedChanges(): boolean {
    return this.baseForm()?.isFormDirty || false;
  }

  /** Invoked by the host-facing `submit()`; delegates to the base form, which emits `submitted`. */
  protected onSubmit(): void {
    this.baseForm()?.submit();
  }

  protected onNamespaceSubmitted(newNamespace: NamespaceChanges): void {
    this.closeWith(newNamespace);
  }
}
