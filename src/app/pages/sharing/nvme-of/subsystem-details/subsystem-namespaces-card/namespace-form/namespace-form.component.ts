import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
export class NamespaceFormComponent extends SidePanelForm<NamespaceChanges> {
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private baseForm = viewChild(BaseNamespaceFormComponent);

  /** Gates the host-rendered footer Save. */
  readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  /** Form data supplied by the `tn-side-panel` host. */
  readonly namespaceData = input<NamespaceFormParams>();

  protected existingNamespace = computed<NvmeOfNamespace>(() => this.namespaceData()?.namespace);
  protected error = signal<unknown>(null);
  private readonly isLoading = signal(false);

  readonly canSubmit = computed(() => (this.baseForm()?.canSubmit() ?? false) && !this.isLoading());

  private get data(): NamespaceFormParams | undefined {
    return this.namespaceData();
  }

  protected get subsystemId(): number {
    return this.data?.subsystemId;
  }

  /** The form lives in the projected base form; only read through the guarded overrides below. */
  protected get form(): Pick<AbstractControl, 'dirty' | 'status' | 'statusChanges'> {
    return this.baseForm()?.form;
  }

  override isBusy(): boolean {
    return this.isLoading();
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
    const payload = {
      ...newNamespace,
      subsys_id: this.subsystemId,
    };

    const request$ = this.existingNamespace()
      ? this.api.call('nvmet.namespace.update', [this.existingNamespace().id, payload])
      : this.api.call('nvmet.namespace.create', [payload]);

    this.isLoading.set(true);
    request$.pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    )
      .subscribe({
        next: () => {
          const message = this.existingNamespace()
            ? this.translate.instant('Namespace updated.')
            : this.translate.instant('Namespace created.');

          this.snackbar.success(message);

          this.closeWith(newNamespace);
        },
        error: (error: unknown) => {
          this.error.set(error);
        },
      });
  }
}
