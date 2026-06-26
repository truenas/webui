import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnCardComponent,
  TnIconComponent,
  TnListComponent,
  TnListItemComponent,
  TnTestIdDirective,
  TnTooltipDirective,
} from '@truenas/ui-components';
import { ContainerStatus } from 'app/enums/container.enum';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';

@Component({
  selector: 'ix-container-tools',
  templateUrl: './container-tools.component.html',
  styleUrls: ['./container-tools.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnListComponent,
    TnListItemComponent,
    TnIconComponent,
    TnTooltipDirective,
    TnTestIdDirective,
    TranslateModule,
  ],
})
export class ContainerToolsComponent {
  private containersStore = inject(ContainersStore);
  private router = inject(Router);

  protected readonly container = this.containersStore.selectedContainer;

  protected readonly isContainerStopped = computed(() => {
    return this.container()?.status?.state !== ContainerStatus.Running;
  });

  protected openShell(containerId: number): void {
    this.router.navigate(['/containers', 'view', containerId, 'shell']);
  }
}
