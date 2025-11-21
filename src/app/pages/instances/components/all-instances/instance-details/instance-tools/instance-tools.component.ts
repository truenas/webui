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
import { ContainerInstancesStore } from 'app/pages/instances/stores/container-instances.store';

@Component({
  selector: 'ix-instance-tools',
  templateUrl: './instance-tools.component.html',
  styleUrls: ['./instance-tools.component.scss'],
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
export class InstanceToolsComponent {
  private instancesStore = inject(ContainerInstancesStore);

  protected readonly instance = this.instancesStore.selectedInstance;

  protected readonly isInstanceStopped = computed(() => {
    return this.instance()?.status?.state !== ContainerStatus.Running;
  });
}
