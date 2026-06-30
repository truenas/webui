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
import { NvmeOfHost } from 'app/interfaces/nvme-of.interface';
import { sidePanelFormCloseGuard } from 'app/modules/slide-ins/side-panel-form.directive';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { HostFormComponent } from 'app/pages/sharing/nvme-of/hosts/host-form/host-form.component';
import { ManageHostsDialog } from 'app/pages/sharing/nvme-of/hosts/manage-hosts/manage-hosts-dialog.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';

@Component({
  selector: 'ix-add-host-menu',
  templateUrl: './add-host-menu.component.html',
  styleUrl: './add-host-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TnMenuComponent,
    TnMenuItemComponent,
    TnMenuTriggerDirective,
    TnDividerComponent,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    HostFormComponent,
    TranslateModule,
    RequiresRolesDirective,
  ],
})
export class AddHostMenuComponent {
  private tnDialog = inject(TnDialog);
  private nvmeOfStore = inject(NvmeOfStore);
  private unsavedChanges = inject(UnsavedChangesService);

  hosts = input.required<NvmeOfHost[]>();
  showAllowAnyHost = input(false);
  hostSelected = output<NvmeOfHost>();
  allowAllHostsSelected = output();

  // "Create New" host form hosted in a <tn-side-panel> (the form is dual-host: it also
  // still opens via legacy SlideIn from the manage-hosts dialog).
  protected readonly hostPanelOpen = signal(false);
  protected readonly hostForm = viewChild(HostFormComponent);
  protected readonly hostCloseGuard = sidePanelFormCloseGuard(this.unsavedChanges, () => this.hostForm());

  protected allHosts = this.nvmeOfStore.hosts;

  protected noHostsExist = computed(() => !this.allHosts().length);

  protected unusedHosts = computed(() => {
    const usedHostIds = this.hosts().map((host) => host.id);
    const unusedHosts = this.allHosts().filter((host) => !usedHostIds.includes(host.id));
    return sortBy(unusedHosts, ['hostnqn']);
  });

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];
  protected readonly menuDownIcon = tnIconMarker('menu-down', 'mdi');

  protected openHostForm(): void {
    this.hostPanelOpen.set(true);
  }

  protected onHostSaved(host: NvmeOfHost): void {
    this.hostPanelOpen.set(false);
    this.selectHost(host);
  }

  protected selectHost(host: NvmeOfHost): void {
    this.hostSelected.emit(host);
  }

  protected manageHosts(): void {
    this.tnDialog.open(ManageHostsDialog, {
      minWidth: '450px',
      maxWidth: '768px',
    });
  }

  protected allowAllHosts(): void {
    this.allowAllHostsSelected.emit();
  }
}
