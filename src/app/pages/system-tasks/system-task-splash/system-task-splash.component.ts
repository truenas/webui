import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TnCardComponent, TnIconComponent } from '@truenas/ui-components';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';

/**
 * Full screen splash shown while the system is restarting, shutting down, failing over or
 * resetting its configuration. Presentational only - the hosting page owns the API calls.
 */
@Component({
  selector: 'ix-system-task-splash',
  templateUrl: './system-task-splash.component.html',
  styleUrls: ['./system-task-splash.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnIconComponent,
    CopyrightLineComponent,
  ],
})
export class SystemTaskSplashComponent {
  /** Already translated status line. Omitted on the config reset screen, which shows the logo alone. */
  readonly message = input<string>();
}
