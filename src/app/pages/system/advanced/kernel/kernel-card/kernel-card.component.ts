import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { KernelFormComponent } from 'app/pages/system/advanced/kernel/kernel-form/kernel-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-kernel-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './kernel-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KernelCardComponent {
  readonly debugKernel$ = this.store$.pipe(
    waitForAdvancedConfig,
    map((config) => config.debugkernel),
    toLoadingState(),
  );

  constructor(
    private store$: Store<AppState>,
    private slideInService: IxSlideInService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  async onConfigurePressed(debugKernel: boolean): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    this.slideInService.open(KernelFormComponent, { data: debugKernel });
  }
}
