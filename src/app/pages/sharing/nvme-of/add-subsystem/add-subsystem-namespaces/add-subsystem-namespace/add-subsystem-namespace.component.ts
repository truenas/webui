import { ChangeDetectionStrategy, Component, output, viewChild } from '@angular/core';
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
export class AddSubsystemNamespaceComponent {
  private baseForm = viewChild(BaseNamespaceFormComponent);

  /** Emitted to a `tn-side-panel` host with the new namespace on save. */
  readonly closed = output<NamespaceChanges>();

  /** Host hook (tn-side-panel closeGuard) to confirm before discarding unsaved edits. */
  hasUnsavedChanges(): boolean {
    return this.baseForm()?.isFormDirty || false;
  }

  onSubmit(newNamespace: NamespaceChanges): void {
    this.closed.emit(newNamespace);
  }
}
