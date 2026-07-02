import {
  ChangeDetectionStrategy, Component, DestroyRef, Type, computed, inject, input, output,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnDialog, TnIconComponent } from '@truenas/ui-components';
import { sortBy } from 'lodash-es';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ManagePortsDialog } from 'app/pages/sharing/nvme-of/ports/manage-ports/manage-ports-dialog.component';
import { PortDescriptionComponent } from 'app/pages/sharing/nvme-of/ports/port-description/port-description.component';
import { PortFormComponent } from 'app/pages/sharing/nvme-of/ports/port-form/port-form.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';

@Component({
  selector: 'ix-add-port-menu',
  templateUrl: './add-port-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
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
  private formPanel = inject(FormSidePanelService);
  private tnDialog = inject(TnDialog);
  private nvmeOfStore = inject(NvmeOfStore);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  // PortFormComponent keeps the `<ix-form>` wrapper, so it doesn't nominally extend
  // SidePanelForm — but it exposes the same closed/canSubmit/submit surface the panel host reads.
  private readonly portForm = PortFormComponent as unknown as Type<SidePanelForm<NvmeOfPort | null>>;

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
    this.formPanel
      .open(this.portForm, { title: this.translate.instant('Add Port') })
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
