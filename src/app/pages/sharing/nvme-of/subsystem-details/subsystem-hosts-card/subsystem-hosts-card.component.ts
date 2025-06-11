import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfSubsystemDetails, NvmeOfHost } from 'app/interfaces/nvme-of.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AddHostMenuComponent } from 'app/pages/sharing/nvme-of/hosts/add-host-menu/add-host-menu.component';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-subsystem-hosts-card',
  templateUrl: './subsystem-hosts-card.component.html',
  styleUrl: './subsystem-hosts-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    MatTooltip,
    AddHostMenuComponent,
    MatIconButton,
    TestDirective,
  ],
})
export class SubsystemHostsCardComponent {
  subsystem = input.required<NvmeOfSubsystemDetails>();

  protected helptext = helptextNvmeOf;

  constructor(
    private loader: LoaderService,
    private errorHandler: ErrorHandlerService,
    private nvmeOfService: NvmeOfService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private nvmeOfStore: NvmeOfStore,
  ) {}

  protected onHostAdded(host: NvmeOfHost): void {
    const subsystem = this.subsystem();

    const disallowAll$ = subsystem.allow_any_host
      ? this.nvmeOfService.updateSubsystem(subsystem, { allow_any_host: false })
      : of(null);

    disallowAll$
      .pipe(
        switchMap(() => this.nvmeOfService.associateHosts(subsystem, [host])),
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        // TODO: Consider reloading a single record or removing loading animation.
        this.snackbar.success(this.translate.instant('Host added to the subsystem'));
        this.nvmeOfStore.initialize();
      });
  }

  protected onAllowAllHostsSelected(): void {
    const subsystem = this.subsystem();

    this.nvmeOfService.updateSubsystem(subsystem, { allow_any_host: true })
      .pipe(
        switchMap(() => {
          const removalCalls = subsystem.hosts.map((host) => (
            this.nvmeOfService.removeHostAssociation(subsystem, host)
          ));

          return removalCalls.length ? forkJoin(removalCalls) : of([]);
        }),
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('All hosts are now allowed'));
        this.nvmeOfStore.initialize();
      });
  }

  protected onRemoveAssociation(host: NvmeOfHost): void {
    this.nvmeOfService.removeHostAssociation(this.subsystem(), host)
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Host removed from the subsystem'));
        this.nvmeOfStore.initialize();
      });
  }
}
