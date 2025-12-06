import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfPort, NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AddPortMenuComponent } from 'app/pages/sharing/nvme-of/ports/add-port-menu/add-port-menu.component';
import { PortDescriptionComponent } from 'app/pages/sharing/nvme-of/ports/port-description/port-description.component';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { subsystemPortsCardElements } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-ports-card/subsystem-ports-card.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-subsystem-ports-card',
  templateUrl: './subsystem-ports-card.component.html',
  styleUrl: './subsystem-ports-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    IxIconComponent,
    PortDescriptionComponent,
    TranslateModule,
    AddPortMenuComponent,
    MatIconButton,
    TestDirective,
    UiSearchDirective,
    MatTooltip,
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

  subsystem = input.required<NvmeOfSubsystemDetails>();

  protected helptext = helptextNvmeOf;

  protected readonly searchableElements = subsystemPortsCardElements;

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  protected onPortAdded(port: NvmeOfPort): void {
    this.nvmeOfService.associatePorts(this.subsystem(), [port])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
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
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Port removed from the subsystem'));
        this.nvmeOfStore.initialize();
      });
  }
}
