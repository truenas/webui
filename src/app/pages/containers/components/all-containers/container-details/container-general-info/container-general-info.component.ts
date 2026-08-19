import { ChangeDetectionStrategy, Component, input, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardActions, MatCardContent, MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { containerCapabilitiesPolicyLabels, containerIdmapTypeLabels, containerTimeLabels } from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
import { Container, ContainerDeleteOptions } from 'app/interfaces/container.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  DeleteContainerDialog,
} from 'app/pages/containers/components/common/delete-container-dialog/delete-container-dialog.component';
import { ContainerFormComponent } from 'app/pages/containers/components/container-form/container-form.component';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-container-general-info',
  templateUrl: './container-general-info.component.html',
  styleUrls: ['./container-general-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatCard,
    MatCardTitle,
    MatCardHeader,
    MatCardActions,
    MatCardContent,
    TranslateModule,
    YesNoPipe,
    MapValuePipe,
    RequiresRolesDirective,
    TestDirective,
  ],
})
export class ContainerGeneralInfoComponent {
  protected formatter = inject(IxFormatterService);
  private destroyRef = inject(DestroyRef);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private matDialog = inject(MatDialog);
  private slideIn = inject(SlideIn);
  private snackbar = inject(SnackbarService);
  private containersStore = inject(ContainersStore);

  container = input.required<Container>();

  protected readonly Role = Role;
  protected readonly containerCapabilitiesPolicyLabels = containerCapabilitiesPolicyLabels;
  protected readonly containerIdmapTypeLabels = containerIdmapTypeLabels;
  protected readonly containerTimeLabels = containerTimeLabels;

  editContainer(): void {
    this.slideIn
      .open(ContainerFormComponent, { data: this.container() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          // Reload the container data if the form was saved successfully
          if (result?.response) {
            this.containersStore.reload();
          }
        },
      });
  }

  /**
   * `container.delete` is a job: it stops the container when asked to, tears down the libvirt
   * domain and destroys the container dataset, so it runs behind a job progress dialog rather
   * than a plain loader. The dialog collects the `force`/`recursive` options middleware now
   * requires - without `recursive` a container whose dataset has snapshots (a pool-root
   * periodic snapshot task is enough) cannot be deleted at all.
   */
  deleteContainer(): void {
    this.matDialog.open<DeleteContainerDialog, Container, ContainerDeleteOptions | false>(DeleteContainerDialog, {
      data: this.container(),
      // The dialog grows when `recursive` reveals its warning. Anchoring it near the top makes it
      // expand downwards instead of re-centering, which moves the whole dialog under the cursor.
      position: { top: '10vh' },
    })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((options: ContainerDeleteOptions) => {
          return this.dialogService.jobDialog(
            this.api.job('container.delete', [this.container().id, options]),
            { title: this.translate.instant('Deleting Container') },
          ).afterClosed();
        }),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Container deleted'));
        this.containersStore.reload();
        this.router.navigate(['/containers']);
      });
  }
}
