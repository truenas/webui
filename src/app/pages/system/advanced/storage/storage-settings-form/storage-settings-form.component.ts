import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, signal, inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  forkJoin, map, Observable, of,
} from 'rxjs';
import { tap } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Weekday, weekdayLabels } from 'app/enums/weekday.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { ResilverConfig } from 'app/interfaces/resilver-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { TaskService } from 'app/services/task.service';
import { AppState } from 'app/store';
import { selectService } from 'app/store/services/services.selectors';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

export interface StorageSettingsData {
  systemDatasetPool: string;
  priorityResilver: ResilverConfig;
}

@Component({
  selector: 'ix-storage-settings-form',
  styleUrls: ['./storage-settings-form.component.scss'],
  templateUrl: './storage-settings-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    IxFormComponent,
    TranslateModule,
    AsyncPipe,
    WarningComponent,
  ],
})
export class StorageSettingsFormComponent implements OnInit {
  private api = inject(ApiService);
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);
  private taskService = inject(TaskService);
  private auth = inject(AuthService);
  slideInRef = inject<SlideInRef<StorageSettingsData, boolean>>(SlideInRef);

  protected readonly rolesToEditPool = [Role.DatasetWrite];
  protected readonly rolesToEditPriorityResilver = [Role.PoolWrite];

  protected readonly anyRoles = [...this.rolesToEditPool, ...this.rolesToEditPriorityResilver];

  protected readonly helptext = helptextSystemAdvanced.storageSettings;

  protected form = this.formBuilder.group({
    systemDatasetPool: ['', Validators.required],
    priorityResilver: this.formBuilder.group({
      enabled: [true],
      begin: [''],
      end: [''],
      weekday: [[
        Weekday.Monday,
        Weekday.Tuesday,
        Weekday.Wednesday,
        Weekday.Thursday,
        Weekday.Friday,
        Weekday.Saturday,
        Weekday.Sunday,
      ], Validators.required],
    }),
  });

  // Snapshot is set after we patch and selectively disable controls, so the
  // wrapper's diff sees the post-role-disable shape as the baseline. Using
  // `initialFormSnapshot` (instead of `editData`) because Angular's
  // `patchValue` skips disabled controls — we must patch before disabling.
  protected initialSnapshot = signal<StorageSettingsData | null>(null);

  protected poolOptions$ = this.api.call('systemdataset.pool_choices').pipe(choicesToOptions());
  protected daysOfWeek$ = of(mapToOptions(weekdayLabels, this.translate));
  protected timeOptions$ = of(this.taskService.getTimeOptions());

  protected isSmbRunning$ = this.store$.select(selectService(ServiceName.Cifs)).pipe(
    map((service) => service?.state === ServiceStatus.Running),
  );

  ngOnInit(): void {
    this.form.patchValue(this.slideInRef.getData());
    this.disableControlsBasedOnRoles();
    this.initialSnapshot.set(this.form.getRawValue() as StorageSettingsData);
  }

  private disableControlsBasedOnRoles(): void {
    if (!this.auth.hasRole(this.rolesToEditPool)) {
      this.form.controls.systemDatasetPool.disable();
    }

    if (!this.auth.hasRole(this.rolesToEditPriorityResilver)) {
      this.form.controls.priorityResilver.disable();
    }
  }

  protected handleSubmit = (event: FormSubmitEvent<StorageSettingsData>): SubmitResult => {
    const requests: Observable<unknown>[] = [];

    if ('priorityResilver' in event.changedValues) {
      requests.push(
        this.api.call('pool.resilver.update', [this.form.controls.priorityResilver.getRawValue()]),
      );
    }

    if ('systemDatasetPool' in event.changedValues) {
      requests.push(
        this.api.job('systemdataset.update', [{ pool: event.allValues.systemDatasetPool }]).pipe(
          tap(() => this.store$.dispatch(advancedConfigUpdated())),
        ),
      );
    }

    return {
      request$: forkJoin(requests),
      successMessage: this.translate.instant('Storage Settings Updated.'),
    };
  };
}
