import { ChangeDetectionStrategy, Component, computed, inject, output, viewChild } from '@angular/core';
import { of } from 'rxjs';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
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
  /** Present when opened via legacy SlideIn host. Absent when hosted in `<tn-side-panel>`. */
  readonly slideInRef = inject<SlideInRef<void, NamespaceChanges>>(SlideInRef, { optional: true });
  private baseForm = viewChild(BaseNamespaceFormComponent);

  /** Emitted with the namespace changes when hosted in a `<tn-side-panel>`. */
  readonly saved = output<NamespaceChanges>();

  /** Whether the form can be submitted — read by a `<tn-side-panel>` host's footer Save. */
  readonly canSubmit = computed(() => this.baseForm()?.canSubmit() ?? false);

  constructor() {
    this.slideInRef?.requireConfirmationWhen(() => of(this.hasUnsavedChanges()));
  }

  /** Public entry point for a `<tn-side-panel>` host's footer Save. */
  submit(): void {
    this.baseForm()?.submit();
  }

  hasUnsavedChanges(): boolean {
    return this.baseForm()?.isFormDirty ?? false;
  }

  onSubmit(newNamespace: NamespaceChanges): void {
    if (this.slideInRef) {
      this.slideInRef.close({ response: newNamespace });
    } else {
      this.saved.emit(newNamespace);
    }
  }
}
