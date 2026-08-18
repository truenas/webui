import { Overlay } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy, Component, input, inject, DestroyRef,
} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective, TnDialog,
} from '@truenas/ui-components';
import { filter, switchMap } from 'rxjs';
import { containerCapabilitiesPolicyLabels, containerIdmapTypeLabels, containerTimeLabels } from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
import { Container, ContainerDeleteOptions } from 'app/interfaces/container.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
    TnButtonComponent,
    TnCardComponent,
    TnCardFooterActionsDirective,
    TranslateModule,
    YesNoPipe,
    MapValuePipe,
  ],
})
export class ContainerGeneralInfoComponent {
  protected formatter = inject(IxFormatterService);
  private destroyRef = inject(DestroyRef);
  private dialogService = inject(DialogService);
  private tnDialog = inject(TnDialog);
  private overlay = inject(Overlay);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private router = inject(Router);
  private formPanel = inject(FormSidePanelService);
  private containersStore = inject(ContainersStore);
  private authService = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);

  container = input.required<Container>();

  protected readonly Role = Role;
  protected readonly containerCapabilitiesPolicyLabels = containerCapabilitiesPolicyLabels;
  protected readonly containerIdmapTypeLabels = containerIdmapTypeLabels;
  protected readonly containerTimeLabels = containerTimeLabels;

  protected readonly canModify = toSignal(
    this.authService.hasRole([Role.ContainerWrite]),
    { initialValue: false },
  );

  protected editContainer(): void {
    this.formPanel.open(ContainerFormComponent, {
      title: this.translate.instant('Edit Container: {name}', { name: this.container().name }),
      wide: true,
      inputs: { editContainer: this.container() },
    }).onSuccess(() => this.containersStore.reload(), this.destroyRef);
  }

  /**
   * `container.delete` is a job: it stops the container when asked to, tears down the libvirt
   * domain and destroys the container dataset, so it runs behind a job progress dialog rather
   * than a plain loader. The dialog collects the `force`/`recursive` options middleware now
   * requires — without `recursive` a container whose dataset has snapshots (a pool-root
   * periodic snapshot task is enough) cannot be deleted at all.
   */
  protected deleteContainer(): void {
    this.tnDialog.open(DeleteContainerDialog, {
      data: this.container(),
      // The dialog grows when `recursive` reveals its warning. Anchoring it near the top makes it
      // expand downwards instead of re-centering, which moves the whole dialog under the cursor.
      positionStrategy: this.overlay.position().global().centerHorizontally().top('10vh'),
    })
      .closed
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
