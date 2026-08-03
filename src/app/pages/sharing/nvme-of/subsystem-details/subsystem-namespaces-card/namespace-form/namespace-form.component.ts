import {
  ChangeDetectionStrategy, Component, computed, inject, input,
} from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  BaseNamespaceFormComponent,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/base-namespace-form.component';
import {
  createNamespaceForm, NamespaceFormValue, toNamespaceChanges,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-form.utils';

export interface NamespaceFormParams {
  namespace?: NvmeOfNamespace;
  subsystemId: number;
}

@Component({
  selector: 'ix-namespace-form',
  templateUrl: './namespace-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFormComponent,
    BaseNamespaceFormComponent,
  ],
})
export class NamespaceFormComponent extends IxFormHostForm {
  private api = inject(ApiService);
  private formBuilder = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);

  /** Gates the host-rendered footer Save. */
  readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  /** Form data supplied by the `tn-side-panel` host, which sets inputs before `ngOnInit`. */
  readonly namespaceData = input.required<NamespaceFormParams>();

  protected existingNamespace = computed(() => this.namespaceData().namespace);
  protected isEdit = computed(() => Boolean(this.existingNamespace()));

  // Owned here (not by the projected base form) so `<ix-form>` can take it as a required input.
  protected readonly form = createNamespaceForm(this.formBuilder);

  protected handleSubmit = (event: FormSubmitEvent<NamespaceFormValue>): SubmitResult => {
    const payload = {
      ...toNamespaceChanges(event.allValues),
      subsys_id: this.namespaceData().subsystemId,
    };

    const request$ = this.isEdit()
      ? this.api.call('nvmet.namespace.update', [this.existingNamespace().id, payload])
      : this.api.call('nvmet.namespace.create', [payload]);

    return {
      request$,
      successMessage: this.isEdit()
        ? this.translate.instant('Namespace updated.')
        : this.translate.instant('Namespace created.'),
    };
  };
}
