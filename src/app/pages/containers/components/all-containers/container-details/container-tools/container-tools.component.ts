import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnCardComponent, TnTooltipDirective } from '@truenas/ui-components';
import { ContainerStatus } from 'app/enums/container.enum';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';

@Component({
  selector: 'ix-container-tools',
  templateUrl: './container-tools.component.html',
  styleUrls: ['./container-tools.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnButtonComponent,
    TranslateModule,
    TnTooltipDirective,
    RouterLink,
  ],
})
export class ContainerToolsComponent {
  private containersStore = inject(ContainersStore);

  protected readonly container = this.containersStore.selectedContainer;

  protected readonly isContainerStopped = computed(() => {
    return this.container()?.status?.state !== ContainerStatus.Running;
  });
}
