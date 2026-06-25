import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnSelectComponent,
} from '@truenas/ui-components';
import {
  finalize, forkJoin, map, Observable, of, take,
} from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Weekday, weekdayLabels } from 'app/enums/weekday.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { ResilverConfig } from 'app/interfaces/resilver-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
    AsyncPipe,
    WarningComponent,
  ],
})
export class StorageSettingsFormComponent extends SidePanelForm implements OnInit {
  private api = inject(ApiService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);
  private snackbar = inject(SnackbarService);
  private taskService = inject(TaskService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  protected readonly rolesToEditPool = [Role.DatasetWrite];
  protected readonly rolesToEditPriorityResilver = [Role.PoolWrite];

  protected readonly anyRoles = [...this.rolesToEditPool, ...this.rolesToEditPriorityResilver];

  protected isLoading = signal(false);

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

  readonly canSubmit = this.trackCanSubmit(this.isLoading);

  protected poolOptions$ = this.api.call('systemdataset.pool_choices').pipe(choicesToOptions());
  protected daysOfWeek$ = of(mapToOptions(weekdayLabels, this.translate));
  protected timeOptions$ = of(this.taskService.getTimeOptions());

  protected isSmbRunning$ = this.store$.select(selectService(ServiceName.Cifs)).pipe(
    map((service) => service?.state === ServiceStatus.Running),
  );

  ngOnInit(): void {
    this.setFormData();
    this.disableControlsBasedOnRoles();
  }

  private setFormData(): void {
    forkJoin([
      this.api.call('systemdataset.config'),
      this.api.call('pool.resilver.config'),
    ]).pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(([systemDatasetConfig, resilverConfig]) => {
      this.form.patchValue({
        systemDatasetPool: systemDatasetConfig.pool,
        priorityResilver: resilverConfig,
      });
    });
  }

  private disableControlsBasedOnRoles(): void {
    if (!this.auth.hasRole(this.rolesToEditPool)) {
      this.form.controls.systemDatasetPool.disable();
    }

    if (!this.auth.hasRole(this.rolesToEditPriorityResilver)) {
      this.form.controls.priorityResilver.disable();
    }
  }

  protected onSubmit(): void {
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
      // No changes made
      this.close(false);
      return;
    }

    this.isLoading.set(true);

    forkJoin(requests)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        complete: () => {
          this.snackbar.success(this.translate.instant('Storage Settings Updated.'));
          this.close(true);
        },
        error: (error: unknown) => {
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }
}
