import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, output, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SidePanelHostCloseable } from 'app/modules/slide-ins/side-panel-form.directive';
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
export class NamespaceFormComponent implements SidePanelHostCloseable<NamespaceChanges> {
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private loader = inject(LoaderService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private baseForm = viewChild(BaseNamespaceFormComponent);

  /** Form data supplied by the `tn-side-panel` host. */
  readonly namespaceData = input<NamespaceFormParams>();

  /** Emitted to a `tn-side-panel` host with the saved namespace on success. */
  readonly closed = output<NamespaceChanges>();

  protected existingNamespace = computed<NvmeOfNamespace>(() => this.namespaceData()?.namespace);
  protected error = signal<unknown>(null);

  private get data(): NamespaceFormParams | undefined {
    return this.namespaceData();
  }

  protected get subsystemId(): number {
    return this.data?.subsystemId;
  }

  /** Host hook (tn-side-panel closeGuard) to confirm before discarding unsaved edits. */
  hasUnsavedChanges(): boolean {
    return this.baseForm()?.isFormDirty || false;
  }

  protected onSubmit(newNamespace: NamespaceChanges): void {
    const payload = {
      ...newNamespace,
      subsys_id: this.subsystemId,
    };

    const request$ = this.existingNamespace()
      ? this.api.call('nvmet.namespace.update', [this.existingNamespace().id, payload])
      : this.api.call('nvmet.namespace.create', [payload]);

    request$.pipe(
      this.loader.withLoader(),
      takeUntilDestroyed(this.destroyRef),
    )
      .subscribe({
        next: () => {
          const message = this.existingNamespace()
            ? this.translate.instant('Namespace updated.')
            : this.translate.instant('Namespace created.');

          this.snackbar.success(message);

          this.closed.emit(newNamespace);
        },
        error: (error: unknown) => {
          this.error.set(error);
        },
      });
  }
}
