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
import { NvmeOfHost } from 'app/interfaces/nvme-of.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { HostFormComponent } from 'app/pages/sharing/nvme-of/hosts/host-form/host-form.component';
import { ManageHostsDialog } from 'app/pages/sharing/nvme-of/hosts/manage-hosts/manage-hosts-dialog.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';

@UntilDestroy()
@Component({
  selector: 'ix-add-host-menu',
  templateUrl: './add-host-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    MatButton,
    MatMenu,
    MatMenuItem,
    TestDirective,
    TranslateModule,
    MatMenuTrigger,
    MatDivider,
    RequiresRolesDirective,
  ],
})
export class AddHostMenuComponent {
  private slideIn = inject(SlideIn);
  private matDialog = inject(MatDialog);
  private nvmeOfStore = inject(NvmeOfStore);

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

  protected openHostForm(): void {
    this.slideIn
      .open(HostFormComponent)
      .pipe(
        filter((response) => Boolean(response.response)),
        untilDestroyed(this),
      )
      .subscribe((response) => {
        this.selectHost(response.response);
      });
  }

  protected selectHost(host: NvmeOfHost): void {
    this.hostSelected.emit(host);
  }

  protected manageHosts(): void {
    this.matDialog.open(ManageHostsDialog, {
      minWidth: '450px',
    });
  }

  protected allowAllHosts(): void {
    this.allowAllHostsSelected.emit();
  }
}
