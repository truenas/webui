import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { VirtualizationGlobalState } from 'app/enums/virtualization.enum';
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
  VirtualizationStateComponent,
} from 'app/pages/instances/components/all-instances/all-instances-header/virtualization-state/virtualization-state.component';
import {
  VolumesDialog,
} from 'app/pages/instances/components/common/volumes-dialog/volumes-dialog.component';
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
    MatAnchor,
    RouterLink,
    VirtualizationStateComponent,
    UiSearchDirective,
    IxIconComponent,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
  ],
})
export class AllInstancesHeaderComponent {
  private slideIn = inject(SlideIn);
  private matDialog = inject(MatDialog);
  private configStore = inject(VirtualizationConfigStore);
  private instanceStore = inject(VirtualizationInstancesStore);

  protected readonly state = this.configStore.virtualizationState;

  protected readonly searchableElements = allInstancesHeaderElements;

  protected readonly needToSetupPool = computed(() => this.state() === VirtualizationGlobalState.NoPool);
  protected readonly isLocked = computed(() => this.state() === VirtualizationGlobalState.Locked);
  protected readonly config = this.configStore.config;

  protected readonly canAddNewInstances = computed(() => this.state() === VirtualizationGlobalState.Initialized);
  protected readonly hasCreateNewButton = computed(() => {
    const state = this.state();
    // Conditions for showing button and button being disabled are different on purpose
    // to communicate current state to the user better.
    return state && [VirtualizationGlobalState.Initializing, VirtualizationGlobalState.Initialized].includes(state);
  });

  protected onGlobalConfiguration(): void {
    this.slideIn
      .open(GlobalConfigFormComponent, { data: this.config() })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.instanceStore.initialize();
        },
      });
  }

  protected onManageVolumes(): void {
    this.matDialog.open(VolumesDialog, {
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
