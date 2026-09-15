import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnSelectComponent } from '@truenas/ui-components';
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
import { AuthService } from 'app/modules/auth/auth.service';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { WarningComponent } from 'app/modules/warning/warning.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { TaskService } from 'app/services/task.service';
import { AppState } from 'app/store';
import { selectService } from 'app/store/services/services.selectors';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

@Component({
  selector: 'ix-storage-settings-form',
  styleUrls: ['./storage-settings-form.component.scss'],
  templateUrl: './storage-settings-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    TranslateModule,
    AsyncPipe,
    WarningComponent,
  ],
})
export class StorageSettingsFormComponent extends IxFormHostForm implements OnInit {
  private api = inject(ApiService);
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);
  private taskService = inject(TaskService);
  private auth = inject(AuthService);

  protected readonly rolesToEditPool = [Role.DatasetWrite];
  protected readonly rolesToEditPriorityResilver = [Role.PoolWrite];

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

  protected poolOptions$ = this.api.call('systemdataset.pool_choices').pipe(choicesToOptions());
  protected daysOfWeek$ = of(mapToOptions(weekdayLabels, this.translate));
  protected timeOptions$ = of(this.taskService.getTimeOptions());

  protected isSmbRunning$ = this.store$.select(selectService(ServiceName.Cifs)).pipe(
    map((service) => service?.state === ServiceStatus.Running),
  );

  ngOnInit(): void {
    // Applied before the load, so a replayed patch never runs against a differently-enabled group.
    this.disableControlsBasedOnRoles();
    this.setFormData();
  }

  private setFormData(): void {
    this.loadFormConfig(
      forkJoin([
        this.api.call('systemdataset.config'),
        this.api.call('pool.resilver.config'),
      ]),
      ([systemDatasetConfig, resilverConfig]) => {
        this.form.patchValue({
          systemDatasetPool: systemDatasetConfig.pool,
          priorityResilver: resilverConfig,
        });
      },
    );
  }

  private disableControlsBasedOnRoles(): void {
    if (!this.auth.hasRole(this.rolesToEditPool)) {
      this.form.controls.systemDatasetPool.disable();
    }

    if (!this.auth.hasRole(this.rolesToEditPriorityResilver)) {
      this.form.controls.priorityResilver.disable();
    }
  }

  // Sends only the sections the user actually touched — the two settings live behind separate
  // endpoints (and separate roles), so an untouched one must not be re-submitted.
  protected handleSubmit = (): SubmitResult => {
    const requests: Observable<unknown>[] = [];

    if (this.form.controls.priorityResilver.dirty) {
      const updateResilver$ = this.api.call('pool.resilver.update', [this.form.controls.priorityResilver.getRawValue()]);
      requests.push(updateResilver$);
    }

    if (this.form.controls.systemDatasetPool.dirty) {
      const updatePool$ = this.api.job('systemdataset.update', [{ pool: this.form.controls.systemDatasetPool.value }]).pipe(
        tap(() => this.store$.dispatch(advancedConfigUpdated())),
      );
      requests.push(updatePool$);
    }

    if (requests.length === 0) {
      // Nothing changed: close as a cancel (falsy payload) so the opener doesn't reload, and stay
      // silent — a function returning `null` is a per-result decision, so it draws no dev warning.
      return {
        request$: of(null),
        successMessage: () => null,
        closeWith: () => false,
      };
    }

    return {
      request$: forkJoin(requests),
      successMessage: this.translate.instant('Storage Settings Updated.'),
    };
  };
}
