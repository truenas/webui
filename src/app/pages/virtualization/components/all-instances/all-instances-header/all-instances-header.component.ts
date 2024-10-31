import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatAnchor, MatButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { VirtualizationGlobalState } from 'app/enums/virtualization.enum';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  GlobalConfigFormComponent,
} from 'app/pages/virtualization/components/all-instances/all-instances-header/global-config-form/global-config-form.component';
import {
  VirtualizationStateComponent,
} from 'app/pages/virtualization/components/all-instances/all-instances-header/virtualization-state/virtualization-state.component';
import {
  VirtualizationConfigStore,
} from 'app/pages/virtualization/stores/virtualization-config.store';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-all-instances-header',
  templateUrl: './all-instances-header.component.html',
  styleUrls: ['./all-instances-header.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    MatButton,
    TestDirective,
    MatAnchor,
    RouterLink,
    VirtualizationStateComponent,
  ],
})
export class AllInstancesHeaderComponent {
  protected readonly isLoading = this.configStore.isLoading;

  protected readonly state = this.configStore.virtualizationState;

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
    private slideIn: ChainedSlideInService,
    private configStore: VirtualizationConfigStore,
  ) {}

  protected onEdit(): void {
    this.slideIn
      .open(GlobalConfigFormComponent, false, this.config())
      .pipe(untilDestroyed(this))
      .subscribe();
  }
}
