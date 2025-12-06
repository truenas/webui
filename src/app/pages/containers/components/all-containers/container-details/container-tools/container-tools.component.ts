import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ContainerStatus } from 'app/enums/container.enum';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';

@Component({
  selector: 'ix-container-tools',
  templateUrl: './container-tools.component.html',
  styleUrls: ['./container-tools.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardTitle,
    MatCardHeader,
    MatCard,
    MatCardContent,
    TranslateModule,
    MatAnchor,
    TestDirective,
    IxIconComponent,
    MatTooltip,
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
