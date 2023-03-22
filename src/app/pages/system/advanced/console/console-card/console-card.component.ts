import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { ConsoleFormComponent } from 'app/pages/system/advanced/console/console-form/console-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';

@Component({
  selector: 'ix-console-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './console-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsoleCardComponent {
  constructor(
    private store$: Store<AppState>,
    private slideIn: IxSlideInService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  async onConfigurePressed(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    this.slideIn.open(ConsoleFormComponent);
  }
}
