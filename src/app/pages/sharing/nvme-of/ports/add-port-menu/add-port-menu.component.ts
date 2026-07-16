import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, output,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnDialog, TnDividerComponent, TnMenuComponent, TnMenuItemComponent, TnMenuTriggerDirective,
  tnIconMarker,
} from '@truenas/ui-components';
import { kebabCase, sortBy } from 'lodash-es';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
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
    TranslateModule,
    PortDescriptionComponent,
    RequiresRolesDirective,
  ],
})
export class AddPortMenuComponent {
  private formPanel = inject(FormSidePanelService);
  private tnDialog = inject(TnDialog);
  private nvmeOfStore = inject(NvmeOfStore);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

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

  // Pre-split with lodash kebabCase so digit-bearing values resolve identically
  // through the legacy [ixTest] directive and the library [tnTestId] directive (see nfs-list).
  protected addPortTestId(port: NvmeOfPort): string[] {
    return ['add-port', kebabCase(port.addr_trtype), kebabCase(port.addr_traddr), kebabCase(String(port.addr_trsvcid))];
  }

  protected readonly menuDownIcon = tnIconMarker('menu-down', 'mdi');

  protected openPortForm(): void {
    this.formPanel
      .open(PortFormComponent, { title: this.translate.instant('Add Port') })
      .onSuccess((port) => {
        if (port) {
          this.selectPort(port);
        }
      }, this.destroyRef);
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
