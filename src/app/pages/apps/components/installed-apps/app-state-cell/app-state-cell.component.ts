import {
  ChangeDetectionStrategy,
  Component, HostBinding,
  computed,
  input,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { appStateIcons, appStateLabels } from 'app/enums/app-state.enum';
import { App, AppStartQueryParams } from 'app/interfaces/app.interface';
import { Job } from 'app/interfaces/job.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-app-state-cell',
  templateUrl: './app-state-cell.component.html',
  styleUrls: ['./app-state-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, MapValuePipe, MatTooltipModule, TnIconComponent],
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
