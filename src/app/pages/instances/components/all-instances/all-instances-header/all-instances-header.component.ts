import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
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
  MapUserGroupIdsDialogComponent,
} from 'app/pages/instances/components/all-instances/all-instances-header/map-user-group-ids-dialog/map-user-group-ids-dialog.component';
import {
  VirtualizationStateComponent,
} from 'app/pages/instances/components/all-instances/all-instances-header/virtualization-state/virtualization-state.component';
import {
  VolumesDialogComponent,
} from 'app/pages/instances/components/common/volumes-dialog/volumes-dialog.component';
import {
  VirtualizationConfigStore,
} from 'app/pages/instances/stores/virtualization-config.store';

@UntilDestroy()
@Component({
  selector: 'ix-all-instances-header',
  templateUrl: './all-instances-header.component.html',
  styleUrls: ['./all-instances-header.component.scss'],
  standalone: true,
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
  protected readonly state = this.configStore.virtualizationState;

  protected readonly searchableElements = allInstancesHeaderElements;

  protected readonly needToSetupPool = computed(() => this.state() === VirtualizationGlobalState.NoPool);
  protected readonly isLocked = computed(() => this.state() === VirtualizationGlobalState.Locked);
  protected readonly config = this.configStore.config;

  protected readonly canAddNewInstances = computed(() => this.state() === VirtualizationGlobalState.Initialized);
  protected readonly hasCreateNewButton = computed(() => {
    // Conditions for showing button and button being disabled are different on purpose
    // to communicate current state to the user better.
    return [VirtualizationGlobalState.Initializing, VirtualizationGlobalState.Initialized].includes(this.state());
  });

  constructor(
    private slideIn: SlideIn,
    private matDialog: MatDialog,
    private configStore: VirtualizationConfigStore,
  ) {}

  protected onGlobalConfiguration(): void {
    this.slideIn
      .open(GlobalConfigFormComponent, { data: this.config() })
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  protected onManageVolumes(): void {
    this.matDialog.open(VolumesDialogComponent, {
      minWidth: '80vw',
    });
  }

  protected onMapUserGroupIds(): void {
    this.matDialog.open(MapUserGroupIdsDialogComponent, {
      minWidth: '80vw',
    });
  }
}
