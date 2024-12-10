import {
  ChangeDetectionStrategy,
  Component, HostBinding,
  computed,
  input,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { appStateIcons, appStateLabels } from 'app/enums/app-state.enum';
import { App, AppStartQueryParams } from 'app/interfaces/app.interface';
import { Job } from 'app/interfaces/job.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-app-state-cell',
  templateUrl: './app-state-cell.component.html',
  styleUrls: ['./app-state-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule, MapValuePipe, MatTooltipModule, IxIconComponent],
})
export class AppStateCellComponent {
  app = input.required<App>();
  job = input<Job<void, AppStartQueryParams>>();
  showIcon = input<boolean>(false);

  @HostBinding('class') get hostClasses(): string[] {
    return [
      'state',
      this.state()?.toLowerCase(),
      this.showIcon() ? 'has-icon' : 'has-cell',
    ];
  }

  state = computed(() => this.app().state);

  protected stateIcons = appStateIcons;
  protected stateLabels = appStateLabels;
}
