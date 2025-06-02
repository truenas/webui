import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfNamespace, NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  NamespaceDescriptionComponent,
} from 'app/pages/sharing/nvme-of/namespaces/namespace-description/namespace-description.component';
import {
  NamespaceDialogComponent,
} from 'app/pages/sharing/nvme-of/namespaces/namespace-dialog/namespace-dialog.component';
import { NewNamespace } from 'app/pages/sharing/nvme-of/namespaces/namespace-dialog/new-namespace.interface';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-subsystem-namespaces-card',
  templateUrl: './subsystem-namespaces-card.component.html',
  styleUrl: './subsystem-namespaces-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    IxIconComponent,
    MatCardContent,
    MatIconButton,
    NamespaceDescriptionComponent,
    MatTooltip,
    TestDirective,
    MatButton,
  ],
})
export class SubsystemNamespacesCardComponent {
  subsystem = input.required<NvmeOfSubsystemDetails>();

  protected readonly helptext = helptextNvmeOf;

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private matDialog: MatDialog,
    private nvmeOfStore: NvmeOfStore,
    private dialogService: DialogService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private loader: LoaderService,
  ) {}

  protected onAddNamespace(): void {
    this.matDialog.open(NamespaceDialogComponent, { minWidth: '400px' })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((newNamespace: NewNamespace) => {
          return this.api.call('nvmet.namespace.create', [{
            ...newNamespace,
            subsys_id: this.subsystem().id,
          }]).pipe(
            this.loader.withLoader(),
            this.errorHandler.withErrorHandler(),
          );
        }),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Namespace created.'));
        this.nvmeOfStore.initialize();
      });
  }

  protected onDeleteNamespace(namespace: NvmeOfNamespace): void {
    this.dialogService.confirm({
      title: this.translate.instant('Please Confirm'),
      message: this.translate.instant('Are you sure you want to delete this namespace?'),
      buttonColor: 'warn',
    })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          return this.api.call('nvmet.namespace.delete', [namespace.id]).pipe(
            this.loader.withLoader(),
            this.errorHandler.withErrorHandler(),
          );
        }),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Namespace deleted.'));
        this.nvmeOfStore.initialize();
      });
  }
}
