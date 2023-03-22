import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { KernelFormComponent } from 'app/pages/system/advanced/kernel/kernel-form/kernel-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@Component({
  selector: 'ix-kernel-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './kernel-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KernelCardComponent {
  constructor(
    private slideIn: IxSlideInService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  async onConfigurePressed(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    this.slideIn.open(KernelFormComponent);
  }
}
