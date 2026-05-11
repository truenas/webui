import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { FormSubmitEvent, IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

interface KernelFormValues {
  debugkernel: boolean;
}

@Component({
  selector: 'ix-kernel-form',
  templateUrl: 'kernel-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxCheckboxComponent,
    IxFormComponent,
    TranslateModule,
  ],
})
export class KernelFormComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);
  slideInRef = inject<SlideInRef<boolean, boolean>>(SlideInRef);

  protected readonly requiredRoles = [Role.SystemAdvancedWrite];

  protected form = this.fb.nonNullable.group({
    debugkernel: [false],
  });

  protected readonly tooltips = {
    debugkernel: helptextSystemAdvanced.debugKernelTooltip,
  };

  protected editData: KernelFormValues = { debugkernel: !!this.slideInRef.getData() };

  protected handleSubmit = (event: FormSubmitEvent<KernelFormValues>): SubmitResult => ({
    request$: this.api.call('system.advanced.update', [event.allValues]),
    successMessage: this.translate.instant('Settings saved'),
    onSuccess: () => this.store$.dispatch(advancedConfigUpdated()),
  });
}
