import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { VirtualizationGlobalState } from 'app/enums/virtualization.enum';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

@Component({
  selector: 'ix-virtualization-state',
  templateUrl: './virtualization-state.component.html',
  styleUrls: ['./virtualization-state.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    TranslateModule,
    MatProgressSpinner,
  ],
})
export class VirtualizationStateComponent {
  readonly state = input.required<VirtualizationGlobalState>();

  protected readonly VirtualizationGlobalState = VirtualizationGlobalState;
}
