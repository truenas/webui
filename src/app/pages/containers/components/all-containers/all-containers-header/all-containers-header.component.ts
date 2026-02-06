import { ChangeDetectionStrategy, Component, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { allContainersHeaderElements } from 'app/pages/containers/components/all-containers/all-containers-header/all-containers-header.elements';
import {
  GlobalConfigFormComponent,
} from 'app/pages/containers/components/all-containers/all-containers-header/global-config-form/global-config-form.component';
import {
  MapUserGroupIdsDialogComponent,
} from 'app/pages/containers/components/all-containers/all-containers-header/map-user-group-ids-dialog/map-user-group-ids-dialog.component';
import { ContainerFormComponent } from 'app/pages/containers/components/container-form/container-form.component';
import {
  ContainerConfigStore,
} from 'app/pages/containers/stores/container-config.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';

@Component({
  selector: 'ix-all-containers-header',
  templateUrl: './all-containers-header.component.html',
  styleUrls: ['./all-containers-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    MatButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    TestDirective,
    UiSearchDirective,
    RequiresRolesDirective,
    TnIconComponent,
  ],
})
export class AllContainersHeaderComponent {
  private destroyRef = inject(DestroyRef);
  private slideIn = inject(SlideIn);
  private matDialog = inject(MatDialog);
  private configStore = inject(ContainerConfigStore);
  private containersStore = inject(ContainersStore);

  protected readonly searchableElements = allContainersHeaderElements;
  protected readonly config = this.configStore.config;
  protected readonly requiredRoles = [Role.ContainerWrite];

  protected onCreateContainer(): void {
    this.slideIn
      .open(ContainerFormComponent)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  protected onGlobalConfiguration(): void {
    this.slideIn
      .open(GlobalConfigFormComponent, { data: this.config() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.configStore.initialize();
          this.containersStore.initialize();
        },
      });
  }

  protected onMapUserGroupIds(): void {
    this.matDialog.open(MapUserGroupIdsDialogComponent, {
      width: '800px',
      panelClass: 'map-user-group-dialog',
    });
  }
}
