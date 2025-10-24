import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { VirtualizationVolume } from 'app/interfaces/container.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { allInstancesHeaderElements } from 'app/pages/instances/components/all-instances/all-instances-header/all-instances-header.elements';
import {
  GlobalConfigFormComponent,
} from 'app/pages/instances/components/all-instances/all-instances-header/global-config-form/global-config-form.component';
import {
  MapUserGroupIdsDialog,
} from 'app/pages/instances/components/all-instances/all-instances-header/map-user-group-ids-dialog/map-user-group-ids-dialog.component';
import {
  VolumesDialog,
  VolumesDialogOptions,
} from 'app/pages/instances/components/common/volumes-dialog/volumes-dialog.component';
import { InstanceFormComponent } from 'app/pages/instances/components/instance-form/instance-form.component';
import {
  VirtualizationConfigStore,
} from 'app/pages/instances/stores/virtualization-config.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';

@UntilDestroy()
@Component({
  selector: 'ix-all-instances-header',
  templateUrl: './all-instances-header.component.html',
  styleUrls: ['./all-instances-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    MatButton,
    TestDirective,
    UiSearchDirective,
    IxIconComponent,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    RequiresRolesDirective,
  ],
})
export class AllInstancesHeaderComponent {
  private slideIn = inject(SlideIn);
  private matDialog = inject(MatDialog);
  private configStore = inject(VirtualizationConfigStore);
  private instanceStore = inject(VirtualizationInstancesStore);

  protected readonly searchableElements = allInstancesHeaderElements;
  protected readonly config = this.configStore.config;
  protected readonly requiredRoles = [Role.ContainerWrite];

  protected onCreateContainer(): void {
    this.slideIn
      .open(InstanceFormComponent)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  protected onGlobalConfiguration(): void {
    this.slideIn
      .open(GlobalConfigFormComponent, { data: this.config() })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.configStore.initialize();
          this.instanceStore.initialize();
        },
      });
  }

  protected onManageVolumes(): void {
    this.matDialog.open<VolumesDialog, VolumesDialogOptions, VirtualizationVolume>(VolumesDialog, {
      minWidth: '80vw',
      data: {
        selectionMode: false,
        config: this.config(),
      },
    });
  }

  protected onMapUserGroupIds(): void {
    this.matDialog.open(MapUserGroupIdsDialog, {
      minWidth: '80vw',
    });
  }
}
