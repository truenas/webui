import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfNamespace, NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  NamespaceDescriptionComponent,
} from 'app/pages/sharing/nvme-of/namespaces/namespace-description/namespace-description.component';
import { NamespaceFormComponent } from 'app/pages/sharing/nvme-of/namespaces/namespace-form/namespace-form.component';
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
  ],
})
export class SubsystemNamespacesCardComponent {
  subsystem = input.required<NvmeOfSubsystemDetails>();

  protected readonly helptext = helptextNvmeOf;

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private slideIn: SlideIn,
    private nvmeOfStore: NvmeOfStore,
    private dialogService: DialogService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private loader: LoaderService,
  ) {}

  protected onEditNamespace(namespace: NvmeOfNamespace): void {
    this.slideIn.open(NamespaceFormComponent, {
      data: namespace,
    })
      .pipe(
        filter((response) => response.response),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Namespace updated.'));
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
