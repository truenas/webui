import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ContainerStatus } from 'app/enums/container.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { ContainerInstance } from 'app/interfaces/container.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

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
  private window = inject<Window>(WINDOW);

  readonly instance = input.required<ContainerInstance>();

  protected readonly isInstanceStopped = computed(() => this.instance().status?.state !== ContainerStatus.Running);
}
