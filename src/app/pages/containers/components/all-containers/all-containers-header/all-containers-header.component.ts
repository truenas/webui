import { ChangeDetectionStrategy, Component, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnDialog,
  TnMenuComponent,
  TnMenuItemComponent,
  TnMenuTriggerDirective,
  tnIconMarker,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
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
  standalone: true,
  imports: [
    TranslateModule,
    TnButtonComponent,
    TnMenuComponent,
    TnMenuItemComponent,
    TnMenuTriggerDirective,
    UiSearchDirective,
    RequiresRolesDirective,
  ],
})
export class AllContainersHeaderComponent {
  private destroyRef = inject(DestroyRef);
  private slideIn = inject(SlideIn);
  private tnDialog = inject(TnDialog);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private configStore = inject(ContainerConfigStore);
  private containersStore = inject(ContainersStore);

  protected readonly searchableElements = allContainersHeaderElements;
  protected readonly config = this.configStore.config;
  protected readonly requiredRoles = [Role.ContainerWrite];
  protected readonly menuDownIcon = tnIconMarker('menu-down', 'mdi');

  protected onCreateContainer(): void {
    this.slideIn
      .open(ContainerFormComponent)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  protected onGlobalConfiguration(): void {
    this.formPanel.open(GlobalConfigFormComponent, {
      title: this.translate.instant('Global Configuration'),
    }).onSuccess(() => {
      this.configStore.initialize();
      this.containersStore.initialize();
    }, this.destroyRef);
  }

  protected onMapUserGroupIds(): void {
    this.tnDialog.open(MapUserGroupIdsDialogComponent, {
      width: '800px',
      panelClass: 'map-user-group-dialog',
    });
  }
}
