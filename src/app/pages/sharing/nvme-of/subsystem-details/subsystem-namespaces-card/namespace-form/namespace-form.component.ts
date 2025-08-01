import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
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

@UntilDestroy()
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
  private snackbar = inject(SnackbarService);
  private loader = inject(LoaderService);
  private translate = inject(TranslateService);

  protected existingNamespace = signal<NvmeOfNamespace>(undefined);
  protected error = signal<unknown>(null);

  constructor() {
    this.existingNamespace.set(this.slideInRef.getData().namespace);
  }

  protected get subsystemId(): number {
    return this.slideInRef.getData().subsystemId;
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
      untilDestroyed(this),
    )
      .subscribe({
        next: () => {
          const message = this.existingNamespace()
            ? this.translate.instant('Namespace updated.')
            : this.translate.instant('Namespace created.');

          this.snackbar.success(message);

          this.slideInRef.close({
            response: newNamespace,
            error: null,
          });
        },
        error: (error: unknown) => {
          this.error.set(error);
        },
      });
  }
}
