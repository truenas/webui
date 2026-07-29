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
import { NvmeOfHost } from 'app/interfaces/nvme-of.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
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
    TranslateModule,
    RequiresRolesDirective,
  ],
})
export class AddHostMenuComponent {
  private formPanel = inject(FormSidePanelService);
  private tnDialog = inject(TnDialog);
  private nvmeOfStore = inject(NvmeOfStore);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  hosts = input.required<NvmeOfHost[]>();
  showAllowAnyHost = input(false);
  hostSelected = output<NvmeOfHost>();
  allowAllHostsSelected = output();

  protected allHosts = this.nvmeOfStore.hosts;

  protected noHostsExist = computed(() => !this.allHosts().length);

  protected unusedHosts = computed(() => {
    const usedHostIds = this.hosts().map((host) => host.id);
    const unusedHosts = this.allHosts().filter((host) => !usedHostIds.includes(host.id));
    return sortBy(unusedHosts, ['hostnqn']);
  });

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  // Pre-split with lodash kebabCase so digit-bearing values resolve identically
  // through the legacy [ixTest] directive and the library [tnTestId] directive (see nfs-list).
  protected hostTestIdSlug(host: NvmeOfHost): string {
    return kebabCase(host.hostnqn);
  }

  protected readonly menuDownIcon = tnIconMarker('menu-down', 'mdi');

  protected openHostForm(): void {
    this.formPanel
      .open(HostFormComponent, { title: this.translate.instant('Add Host') })
      .onSuccess((host) => {
        if (host) {
          this.selectHost(host);
        }
      }, this.destroyRef);
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
