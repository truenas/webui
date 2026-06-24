import { ChangeDetectionStrategy, Component, inject, DestroyRef, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnDialog,
  TnMenuComponent,
  TnMenuItemComponent,
  TnMenuTriggerDirective,
  TnSidePanelActionDirective,
  TnSidePanelComponent,
} from '@truenas/ui-components';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
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
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    UiSearchDirective,
    RequiresRolesDirective,
    GlobalConfigFormComponent,
  ],
})
export class AllContainersHeaderComponent {
  private destroyRef = inject(DestroyRef);
  private slideIn = inject(SlideIn);
  private tnDialog = inject(TnDialog);
  private unsavedChangesService = inject(UnsavedChangesService);
  private configStore = inject(ContainerConfigStore);
  private containersStore = inject(ContainersStore);

  protected readonly searchableElements = allContainersHeaderElements;
  protected readonly config = this.configStore.config;
  protected readonly requiredRoles = [Role.ContainerWrite];

  protected readonly configOpen = signal(false);
  protected readonly configForm = viewChild(GlobalConfigFormComponent);

  protected readonly closeGuard = (): Observable<boolean> => {
    if (!this.configForm()?.hasUnsavedChanges()) {
      return of(true);
    }
    return this.unsavedChangesService.showConfirmDialog();
  };

  protected onCreateContainer(): void {
    this.slideIn
      .open(ContainerFormComponent)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  protected onGlobalConfiguration(): void {
    this.configOpen.set(true);
  }

  protected onConfigClosed(saved: boolean): void {
    this.configOpen.set(false);

    if (saved) {
      this.configStore.initialize();
      this.containersStore.initialize();
    }
  }

  protected onMapUserGroupIds(): void {
    this.tnDialog.open(MapUserGroupIdsDialogComponent, {
      width: '800px',
      panelClass: 'map-user-group-dialog',
    });
  }
}
