import { ChangeDetectionStrategy, Component, computed, input, output, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { sortBy } from 'lodash-es';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ManagePortsDialog } from 'app/pages/sharing/nvme-of/ports/manage-ports/manage-ports-dialog.component';
import { PortDescriptionComponent } from 'app/pages/sharing/nvme-of/ports/port-description/port-description.component';
import { PortFormComponent } from 'app/pages/sharing/nvme-of/ports/port-form/port-form.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';

@UntilDestroy()
@Component({
  selector: 'ix-add-port-menu',
  templateUrl: './add-port-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    MatButton,
    MatMenu,
    MatMenuItem,
    TestDirective,
    TranslateModule,
    MatMenuTrigger,
    PortDescriptionComponent,
    MatDivider,
    RequiresRolesDirective,
  ],
})
export class AddPortMenuComponent {
  private slideIn = inject(SlideIn);
  private matDialog = inject(MatDialog);
  private nvmeOfStore = inject(NvmeOfStore);

  subsystemPorts = input.required<NvmeOfPort[]>();
  portSelected = output<NvmeOfPort>();

  protected allPorts = this.nvmeOfStore.ports;

  protected noPortsExist = computed(() => !this.allPorts().length);

  protected unusedPorts = computed(() => {
    const usedPortIds = this.subsystemPorts().map((port) => port.id);
    const unusedPorts = this.allPorts().filter((port) => !usedPortIds.includes(port.id));
    return sortBy(unusedPorts, ['addr_trtype', 'addr_traddr', 'addr_trsvcid']);
  });

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  protected openPortForm(): void {
    this.slideIn
      .open(PortFormComponent)
      .pipe(
        filter((response) => Boolean(response.response)),
        untilDestroyed(this),
      )
      .subscribe((response) => {
        this.selectPort(response.response);
      });
  }

  protected selectPort(port: NvmeOfPort): void {
    this.portSelected.emit(port);
  }

  protected onManagePorts(): void {
    this.matDialog.open(ManagePortsDialog, {
      minWidth: '450px',
    });
  }
}
