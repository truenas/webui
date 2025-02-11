import {
  ChangeDetectionStrategy, Component, computed, Inject, input,
} from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { VirtualizationStatus, VirtualizationType } from 'app/enums/virtualization.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-instance-tools',
  templateUrl: './instance-tools.component.html',
  styleUrls: ['./instance-tools.component.scss'],
  standalone: true,
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
  readonly instance = input.required<VirtualizationInstance>();

  protected readonly isInstanceStopped = computed(() => this.instance().status !== VirtualizationStatus.Running);
  protected readonly isVm = computed(() => this.instance().type === VirtualizationType.Vm);
  protected readonly vncLink = computed(() => `vnc://${this.window.location.hostname}:${this.instance().vnc_port}`);

  constructor(
    @Inject(WINDOW) private window: Window,
  ) {}
}
