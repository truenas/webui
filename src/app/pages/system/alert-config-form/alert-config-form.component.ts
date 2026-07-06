import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ControlsOf, FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnCardComponent,
  TnCardFooterActionsDirective,
  TnCardHeaderActionsDirective,
  TnEmptyComponent,
  TnFormFieldComponent,
  TnMenuComponent,
  TnMenuItemComponent,
  TnMenuTriggerDirective,
  TnProgressBarComponent,
  TnSelectComponent,
} from '@truenas/ui-components';
import { forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertPolicy } from 'app/enums/alert-policy.enum';
import { Role } from 'app/enums/role.enum';
import { helptextAlertSettings } from 'app/helptext/system/alert-settings';
import { AlertCategory, AlertClassesUpdate, AlertClassSettings } from 'app/interfaces/alert.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-alert-config-form',
  templateUrl: './alert-config-form.component.html',
  styleUrls: ['./alert-config-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    TnCardComponent,
    TnCardHeaderActionsDirective,
    TnCardFooterActionsDirective,
    TnProgressBarComponent,
    TnEmptyComponent,
    TnButtonComponent,
    TnMenuTriggerDirective,
    TnMenuComponent,
    TnMenuItemComponent,
    ReactiveFormsModule,
    FormsModule,
    TnFormFieldComponent,
    TnSelectComponent,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class AlertConfigFormComponent implements OnInit {
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  protected translate = inject(TranslateService);
  private snackbarService = inject(SnackbarService);
  private formBuilder = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.AlertWrite];

  protected categories: AlertCategory[] = [];
  protected selectedCategory: AlertCategory | undefined = undefined;
  protected form = this.formBuilder.group({});
  protected isFormLoading = signal(false);
  protected readonly helptext = helptextAlertSettings;

  protected readonly levelOptions$ = of([
    { label: this.translate.instant('INFO'), value: AlertLevel.Info },
    { label: this.translate.instant('NOTICE'), value: AlertLevel.Notice },
    { label: this.translate.instant('WARNING'), value: AlertLevel.Warning },
    { label: this.translate.instant('ERROR'), value: AlertLevel.Error },
    { label: this.translate.instant('CRITICAL'), value: AlertLevel.Critical },
    { label: this.translate.instant('ALERT'), value: AlertLevel.Alert },
    { label: this.translate.instant('EMERGENCY'), value: AlertLevel.Emergency },
  ]);

  protected readonly policyOptions$ = this.api.call('alert.list_policies').pipe(
    map((policyList) => {
      return policyList.map((policy) => ({ label: ignoreTranslation(policy), value: policy }));
    }),
  );

  ngOnInit(): void {
    this.isFormLoading.set(true);

    forkJoin([
      this.api.call('alert.list_categories'),
      this.api.call('alertclasses.config'),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([categories, alertConfig]) => {
          this.categories = categories;

          if (categories.length) {
            this.selectedCategory = categories[0];
          }

          categories.forEach((category) => {
            category.classes.forEach((cls) => {
              this.form.addControl(cls.id, this.formBuilder.group<AlertClassSettings>({
                level: cls.level,
                policy: AlertPolicy.Immediately,
              }));
              this.form.controls[cls.id].controls.level.defaultValue = cls.level;
              this.form.controls[cls.id].controls.policy.defaultValue = AlertPolicy.Immediately;
            });
          });

          this.form.patchValue(alertConfig.classes);
          this.isFormLoading.set(false);
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  protected onCategoryChanged(category: AlertCategory): void {
    this.selectedCategory = category;
  }

  protected onSubmit(): void {
    this.isFormLoading.set(true);
    const payload: AlertClassesUpdate = { classes: {} };
    Object.entries(this.form.controls)
      .forEach(([className, classControl]: [string, FormGroup<ControlsOf<AlertClassSettings>>]) => {
        const levelControl = classControl.controls.level;
        const policyControl = classControl.controls.policy;
        if (!levelControl || !policyControl) {
          return;
        }

        if (levelControl.value !== levelControl.defaultValue || policyControl.value !== policyControl.defaultValue) {
          payload.classes[className] = {};
          if (levelControl.value !== levelControl.defaultValue) {
            payload.classes[className].level = levelControl.value;
          }
          if (policyControl.value !== policyControl.defaultValue) {
            payload.classes[className].policy = policyControl.value;
          }
        }
      });

    this.api.call('alertclasses.update', [payload]).pipe(
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.snackbarService.success(this.translate.instant('Settings saved.'));
    }).add(() => {
      this.isFormLoading.set(false);
    });
  }
}
