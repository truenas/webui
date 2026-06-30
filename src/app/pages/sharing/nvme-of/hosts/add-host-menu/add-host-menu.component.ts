import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, output, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnDialog, TnDividerComponent, TnMenuComponent, TnMenuItemComponent, TnMenuTriggerDirective,
  TnSidePanelActionDirective, TnSidePanelComponent, tnIconMarker,
} from '@truenas/ui-components';
import { sortBy } from 'lodash-es';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { NvmeOfHost } from 'app/interfaces/nvme-of.interface';
import { sidePanelFormCloseGuard } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { HostFormComponent } from 'app/pages/sharing/nvme-of/hosts/host-form/host-form.component';
import {
  ManageHostsAction, ManageHostsDialog, ManageHostsResult,
} from 'app/pages/sharing/nvme-of/hosts/manage-hosts/manage-hosts-dialog.component';
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
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  hosts = input.required<NvmeOfHost[]>();
  showAllowAnyHost = input(false);
  hostSelected = output<NvmeOfHost>();
  allowAllHostsSelected = output();

  // Host form hosted in a <tn-side-panel> (the form is dual-host: it also still opens via
  // legacy SlideIn elsewhere). Two flows share this panel:
  //  - "associate": "Create New" creates a host and adds it to the current subsystem.
  //  - "manage": Add/Edit from the Manage Hosts dialog creates/updates a host system-wide.
  protected readonly hostPanelOpen = signal(false);
  protected readonly hostToEdit = signal<NvmeOfHost | undefined>(undefined);
  protected readonly isManageFlow = signal(false);
  protected readonly hostForm = viewChild(HostFormComponent);
  protected readonly hostCloseGuard = sidePanelFormCloseGuard(this.unsavedChanges, () => this.hostForm());
  protected readonly hostPanelTitle = computed(() => (
    this.hostToEdit() ? this.translate.instant('Edit Host') : this.translate.instant('Add Host')
  ));

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
    this.isManageFlow.set(false);
    this.hostToEdit.set(undefined);
    this.hostPanelOpen.set(true);
  }

  protected onHostSaved(host: NvmeOfHost): void {
    const wasEditing = !!this.hostToEdit();
    const isManageFlow = this.isManageFlow();
    this.hostPanelOpen.set(false);

    if (isManageFlow) {
      this.snackbar.success(
        wasEditing ? this.translate.instant('Host Updated') : this.translate.instant('Host Added'),
      );
      this.nvmeOfStore.reloadHosts();
      return;
    }

    this.selectHost(host);
  }

  protected selectHost(host: NvmeOfHost): void {
    this.hostSelected.emit(host);
  }

  protected manageHosts(): void {
    this.tnDialog.open(ManageHostsDialog, {
      minWidth: '450px',
      maxWidth: '768px',
    }).closed.pipe(
      filter((result): result is ManageHostsResult => !!result),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((result) => {
      this.isManageFlow.set(true);
      this.hostToEdit.set(result.action === ManageHostsAction.Edit ? result.host : undefined);
      this.hostPanelOpen.set(true);
    });
  }

  protected allowAllHosts(): void {
    this.allowAllHostsSelected.emit();
  }
}
