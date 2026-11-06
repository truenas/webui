import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, output,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnDialog, TnDividerComponent, TnMenuComponent, TnMenuItemComponent, TnMenuTriggerDirective,
  tnIconMarker,
} from '@truenas/ui-components';
import { sortBy } from 'lodash-es';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { normalizeTestIdParts } from 'app/modules/test-id/normalize-test-id.utils';
import { ManagePortsDialog } from 'app/pages/sharing/nvme-of/ports/manage-ports/manage-ports-dialog.component';
import { PortDescriptionComponent } from 'app/pages/sharing/nvme-of/ports/port-description/port-description.component';
import { PortFormComponent } from 'app/pages/sharing/nvme-of/ports/port-form/port-form.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';

interface UnusedPortRow {
  port: NvmeOfPort;
  /**
   * FC and RDMA ports have no `addr_trsvcid`, and {@link normalizeTestIdParts} drops it, so those rows
   * resolve to `add-port-fc-<addr>`; the old literal `-undefined` suffix was a bug and RE knows of the
   * change. Resolved with the row so `[testId]` doesn't get a new array every change-detection pass.
   */
  testId: string[];
}

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

  protected unusedPorts = computed<UnusedPortRow[]>(() => {
    const usedPortIds = this.subsystemPorts().map((port) => port.id);
    const unusedPorts = this.allPorts().filter((port) => !usedPortIds.includes(port.id));

    return sortBy(unusedPorts, ['addr_trtype', 'addr_traddr', 'addr_trsvcid']).map((port) => ({
      port,
      testId: normalizeTestIdParts(['add-port', port.addr_trtype, port.addr_traddr, port.addr_trsvcid]),
    }));
  });

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

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
