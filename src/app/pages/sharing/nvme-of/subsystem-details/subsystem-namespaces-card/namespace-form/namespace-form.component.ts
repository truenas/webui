import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  BaseNamespaceFormComponent,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/base-namespace-form.component';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';

export interface NamespaceFormParams {
  namespace?: NvmeOfNamespace;
  subsystemId: number;
}

@Component({
  selector: 'ix-namespace-form',
  templateUrl: './namespace-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BaseNamespaceFormComponent,
  ],
})
export class NamespaceFormComponent {
  slideInRef = inject<SlideInRef<NamespaceFormParams, NamespaceChanges>>(SlideInRef);
  private api = inject(ApiService);
  private translate = inject(TranslateService);

  protected existingNamespace = signal<NvmeOfNamespace | undefined>(undefined);

  constructor() {
    this.existingNamespace.set(this.slideInRef.getData().namespace);
  }

  protected get subsystemId(): number {
    return this.slideInRef.getData().subsystemId;
  }

  handleSubmit = (changes: NamespaceChanges): SubmitResult => {
    const payload = {
      ...changes,
      subsys_id: this.subsystemId,
    };
    const existing = this.existingNamespace();

    return {
      request$: existing
        ? this.api.call('nvmet.namespace.update', [existing.id, payload])
        : this.api.call('nvmet.namespace.create', [payload]),
      successMessage: existing
        ? this.translate.instant('Namespace updated.')
        : this.translate.instant('Namespace created.'),
      // Slide-in callers want the form's `NamespaceChanges`, not the raw API
      // response object (which is the full NvmeOfNamespace row).
      closeWith: () => changes,
    };
  };
}
