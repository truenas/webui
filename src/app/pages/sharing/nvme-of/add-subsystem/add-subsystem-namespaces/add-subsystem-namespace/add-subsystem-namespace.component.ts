import {
  ChangeDetectionStrategy, Component, inject, signal,
} from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { Role } from 'app/enums/role.enum';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import {
  BaseNamespaceFormComponent,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/base-namespace-form.component';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';
import {
  createNamespaceForm, toNamespaceChanges,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-form.utils';

/**
 * Collects one namespace for the Add Subsystem wizard. Unlike {@link NamespaceFormComponent} it
 * issues no API call — the wizard accumulates namespaces in a form control and creates them all
 * when the subsystem itself is created — so it stays on {@link SidePanelForm} rather than
 * `<ix-form>`, whose contract is built around a submit request.
 */
@Component({
  selector: 'ix-add-subsystem-namespace',
  templateUrl: './add-subsystem-namespace.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BaseNamespaceFormComponent,
  ],
})
export class AddSubsystemNamespaceComponent extends SidePanelForm<NamespaceChanges> {
  private formBuilder = inject(NonNullableFormBuilder);

  /** Gates the host-rendered footer Save. */
  readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  // Owned here (not by the projected base form) so both namespace wrappers build their group the
  // same way; the base form only renders into it.
  protected readonly form = createNamespaceForm(this.formBuilder);

  /** Nothing is ever in flight — the changes are handed to the wizard synchronously. */
  readonly canSubmit = this.trackCanSubmit(signal(false));

  protected onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    this.closeWith(toNamespaceChanges(this.form.getRawValue()));
  }
}
