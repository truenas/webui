import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, output, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
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
export class NamespaceFormComponent {
  /** Present when opened via legacy SlideIn host. Absent when hosted in `<tn-side-panel>`. */
  readonly slideInRef = inject<SlideInRef<NamespaceFormParams, NamespaceChanges>>(SlideInRef, { optional: true });
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private loader = inject(LoaderService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private baseForm = viewChild(BaseNamespaceFormComponent);

  /** Provided by a `<tn-side-panel>` host (the legacy SlideIn host supplies it via `slideInRef`). */
  readonly data = input<NamespaceFormParams>();
  readonly closed = output<NamespaceChanges>();

  protected error = signal<unknown>(null);

  protected readonly existingNamespace = computed(() => this.incomingData?.namespace);

  /** Whether the form can be submitted — read by a `<tn-side-panel>` host's footer Save. */
  readonly canSubmit = computed(() => this.baseForm()?.canSubmit() ?? false);

  constructor() {
    this.slideInRef?.requireConfirmationWhen(() => of(this.hasUnsavedChanges()));
  }

  /** Public entry point for a `<tn-side-panel>` host to trigger submission. */
  submit(): void {
    this.baseForm()?.submit();
  }

  hasUnsavedChanges(): boolean {
    return this.baseForm()?.isFormDirty ?? false;
  }

  private get incomingData(): NamespaceFormParams | undefined {
    return this.slideInRef?.getData() ?? this.data();
  }

  protected onSubmit(newNamespace: NamespaceChanges): void {
    const payload = {
      ...newNamespace,
      subsys_id: this.incomingData?.subsystemId,
    };

    const existing = this.existingNamespace();
    const request$ = existing
      ? this.api.call('nvmet.namespace.update', [existing.id, payload])
      : this.api.call('nvmet.namespace.create', [payload]);

    request$.pipe(
      this.loader.withLoader(),
      takeUntilDestroyed(this.destroyRef),
    )
      .subscribe({
        next: () => {
          this.snackbar.success(existing
            ? this.translate.instant('Namespace updated.')
            : this.translate.instant('Namespace created.'));

          this.close(newNamespace);
        },
        error: (error: unknown) => {
          this.error.set(error);
        },
      });
  }

  private close(saved: NamespaceChanges): void {
    if (this.slideInRef) {
      this.slideInRef.close({ response: saved });
    } else {
      this.closed.emit(saved);
    }
  }
}
