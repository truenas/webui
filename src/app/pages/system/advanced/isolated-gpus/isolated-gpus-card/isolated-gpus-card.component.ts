import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import {
  IsolatedGpusFormComponent,
} from 'app/pages/system/advanced/isolated-gpus/isolated-gpus-form/isolated-gpus-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@Component({
  selector: 'ix-isolated-gpus-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './isolated-gpus-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IsolatedGpusCardComponent {
  constructor(
    private slideIn: IxSlideInService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  async onConfigurePressed(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();

    this.slideIn.open(IsolatedGpusFormComponent);
  }
}
