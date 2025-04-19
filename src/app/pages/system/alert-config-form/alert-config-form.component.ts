import {
  ChangeDetectionStrategy, Component, OnInit,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatProgressBar } from '@angular/material/progress-bar';
import { ControlsOf, FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertPolicy } from 'app/enums/alert-policy.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { helptextAlertSettings } from 'app/helptext/system/alert-settings';
import { AlertCategory, AlertClassesUpdate, AlertClassSettings } from 'app/interfaces/alert.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-alert-config-form',
  templateUrl: './alert-config-form.component.html',
  styleUrls: ['./alert-config-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatProgressBar,
    EmptyComponent,
    MatButton,
    TestDirective,
    MatMenuTrigger,
    IxIconComponent,
    MatMenu,
    MatMenuItem,
    ReactiveFormsModule,
    FormsModule,
    IxSelectComponent,
    TestOverrideDirective,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class AlertConfigFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.AlertWrite];

  noResponseConfig = {
    type: EmptyType.Errors,
    large: true,
    title: this.translate.instant('Cannot retrieve response'),
  };

  categories: AlertCategory[] = [];
  selectedCategory: AlertCategory | undefined = undefined;
  form = this.formBuilder.group({});
  protected isFormLoading = signal(false);
  readonly helptext = helptextAlertSettings;

  readonly levelOptions$ = of([
    { label: this.translate.instant('INFO'), value: AlertLevel.Info },
    { label: this.translate.instant('NOTICE'), value: AlertLevel.Notice },
    { label: this.translate.instant('WARNING'), value: AlertLevel.Warning },
    { label: this.translate.instant('ERROR'), value: AlertLevel.Error },
    { label: this.translate.instant('CRITICAL'), value: AlertLevel.Critical },
    { label: this.translate.instant('ALERT'), value: AlertLevel.Alert },
    { label: this.translate.instant('EMERGENCY'), value: AlertLevel.Emergency },
  ]);

  readonly policyOptions$ = this.api.call('alert.list_policies').pipe(
    map((policyList) => {
      return policyList.map((policy) => ({ label: policy, value: policy }));
    }),
  );

  constructor(
    private api: ApiService,
    public dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    protected translate: TranslateService,
    private snackbarService: SnackbarService,
    private formBuilder: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.isFormLoading.set(true);

    forkJoin([
      this.api.call('alert.list_categories'),
      this.api.call('alertclasses.config'),
    ])
      .pipe(untilDestroyed(this))
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
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              this.form.controls[cls.id].controls.level.defaultValue = cls.level;
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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

  onCategoryChanged(category: AlertCategory): void {
    this.selectedCategory = category;
  }

  onSubmit(): void {
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
      untilDestroyed(this),
    ).subscribe(() => {
      this.snackbarService.success(this.translate.instant('Settings saved.'));
    }).add(() => {
      this.isFormLoading.set(false);
    });
  }
}
