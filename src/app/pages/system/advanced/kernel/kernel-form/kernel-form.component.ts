import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

@UntilDestroy()
@Component({
  templateUrl: 'kernel-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KernelFormComponent {
  isFormLoading = false;
  form = this.fb.group({
    debugkernel: [false],
  });

  readonly tooltips = {
    debugkernel: helptextSystemAdvanced.debugkernel_tooltip,
  };

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
  ) {}

  setupForm(group: AdvancedConfig): void {
    this.form.patchValue({
      debugkernel: group?.debugkernel,
    });
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    const values = this.form.value;
    const commonBody = {
      debugkernel: values.debugkernel,
    };
    this.isFormLoading = true;
    this.ws.call('system.advanced.update', [commonBody]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInService.close();
        this.store$.dispatch(advancedConfigUpdated());
      },
      error: (error) => {
        this.isFormLoading = false;
        new EntityUtils().handleWsError(this, error);
        this.cdr.markForCheck();
      },
    });
  }
}
