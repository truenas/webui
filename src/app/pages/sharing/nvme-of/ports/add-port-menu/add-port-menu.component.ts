import {
  ChangeDetectionStrategy, Component, computed, inject, input, output, signal, viewChild,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnDialog, TnDividerComponent, TnMenuComponent, TnMenuItemComponent, TnMenuTriggerDirective,
  TnSidePanelActionDirective, TnSidePanelComponent, tnIconMarker,
} from '@truenas/ui-components';
import { sortBy } from 'lodash-es';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import { sidePanelFormCloseGuard } from 'app/modules/slide-ins/side-panel-form.directive';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ManagePortsDialog } from 'app/pages/sharing/nvme-of/ports/manage-ports/manage-ports-dialog.component';
import { PortDescriptionComponent } from 'app/pages/sharing/nvme-of/ports/port-description/port-description.component';
import { PortFormComponent } from 'app/pages/sharing/nvme-of/ports/port-form/port-form.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';

@Component({
  selector: 'ix-add-port-menu',
  templateUrl: './add-port-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TnMenuComponent,
    TnMenuItemComponent,
    TnMenuTriggerDirective,
    TnDividerComponent,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    PortFormComponent,
    TranslateModule,
    PortDescriptionComponent,
    RequiresRolesDirective,
  ],
})
export class AddPortMenuComponent {
  private tnDialog = inject(TnDialog);
  private nvmeOfStore = inject(NvmeOfStore);
  private unsavedChanges = inject(UnsavedChangesService);

  subsystemPorts = input.required<NvmeOfPort[]>();
  portSelected = output<NvmeOfPort>();

  // "Create New" port form hosted in a <tn-side-panel> (the form is dual-host: it also
  // still opens via legacy SlideIn from the manage-ports dialog).
  protected readonly portPanelOpen = signal(false);
  protected readonly portForm = viewChild(PortFormComponent);
  protected readonly portCloseGuard = sidePanelFormCloseGuard(this.unsavedChanges, () => this.portForm());

  protected allPorts = this.nvmeOfStore.ports;

  protected noPortsExist = computed(() => !this.allPorts().length);

  protected unusedPorts = computed(() => {
    const usedPortIds = this.subsystemPorts().map((port) => port.id);
    const unusedPorts = this.allPorts().filter((port) => !usedPortIds.includes(port.id));
    return sortBy(unusedPorts, ['addr_trtype', 'addr_traddr', 'addr_trsvcid']);
  });

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];
  protected readonly menuDownIcon = tnIconMarker('menu-down', 'mdi');

  protected openPortForm(): void {
    this.portPanelOpen.set(true);
  }

  protected onPortSaved(port: NvmeOfPort): void {
    this.portPanelOpen.set(false);
    this.selectPort(port);
  }

  protected selectPort(port: NvmeOfPort): void {
    this.portSelected.emit(port);
  }

  protected onManagePorts(): void {
    this.tnDialog.open(ManagePortsDialog, {
      minWidth: '450px',
      maxWidth: '768px',
    });
  }
}
