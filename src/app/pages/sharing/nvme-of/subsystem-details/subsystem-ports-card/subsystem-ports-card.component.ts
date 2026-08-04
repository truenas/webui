import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnBannerComponent, TnCardComponent, TnCardFooterActionsDirective, TnIconButtonComponent,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfPort, NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { normalizeTestIdParts } from 'app/modules/test-id/normalize-test-id.utils';
import { AddPortMenuComponent } from 'app/pages/sharing/nvme-of/ports/add-port-menu/add-port-menu.component';
import { PortDescriptionComponent } from 'app/pages/sharing/nvme-of/ports/port-description/port-description.component';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { subsystemPortsCardElements } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-ports-card/subsystem-ports-card.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

interface PortRow {
  port: NvmeOfPort;
  /**
   * Ports with no `addr_trsvcid` (FC, RDMA) lose the literal `-undefined` suffix the
   * pre-migration id carried — see `UnusedPortRow` in add-port-menu for the full note.
   * Resolved with the row for the same reason: `[testId]` is a signal input, so a
   * template method would hand it a new array on every change detection pass.
   */
  testId: string[];
}

@Component({
  selector: 'ix-subsystem-ports-card',
  templateUrl: './subsystem-ports-card.component.html',
  styleUrl: './subsystem-ports-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    TnBannerComponent,
    TnIconButtonComponent,
    PortDescriptionComponent,
    TranslateModule,
    AddPortMenuComponent,
    UiSearchDirective,
    RequiresRolesDirective,
  ],
})
export class SubsystemPortsCardComponent {
  private loader = inject(LoaderService);
  private errorHandler = inject(ErrorHandlerService);
  private nvmeOfService = inject(NvmeOfService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private nvmeOfStore = inject(NvmeOfStore);
  private destroyRef = inject(DestroyRef);

  subsystem = input.required<NvmeOfSubsystemDetails>();

  protected helptext = helptextNvmeOf;

  protected readonly searchableElements = subsystemPortsCardElements;

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  protected portRows = computed<PortRow[]>(() => {
    return (this.subsystem().ports ?? []).map((port) => ({
      port,
      testId: normalizeTestIdParts([
        'remove-port-association', port.addr_trtype, port.addr_traddr, port.addr_trsvcid,
      ]),
    }));
  });

  protected onPortAdded(port: NvmeOfPort): void {
    this.nvmeOfService.associatePorts(this.subsystem(), [port])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Port added to the subsystem'));
        // TODO: Consider reloading a single record or removing loading animation.
        this.nvmeOfStore.initialize();
      });
  }

  protected onRemoveAssociation(port: NvmeOfPort): void {
    this.nvmeOfService.removePortAssociation(this.subsystem(), port)
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Port removed from the subsystem'));
        this.nvmeOfStore.initialize();
      });
  }
}
