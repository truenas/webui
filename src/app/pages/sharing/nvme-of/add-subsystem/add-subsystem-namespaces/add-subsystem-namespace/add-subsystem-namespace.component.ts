import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
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
  slideInRef = inject<SlideInRef<void, NamespaceChanges>>(SlideInRef);
  private baseForm = viewChild(BaseNamespaceFormComponent);

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.baseForm()?.isFormDirty || false);
    });
  }


  onSubmit(newNamespace: NamespaceChanges): void {
    this.slideInRef.close({
      response: newNamespace,
      error: null,
    });
  }
}
