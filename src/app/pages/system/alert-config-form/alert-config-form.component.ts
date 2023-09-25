import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { ControlsOf, FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertPolicy } from 'app/enums/alert-policy.enum';
import { trackById } from 'app/helpers/track-by.utils';
import helptext from 'app/helptext/system/alert-settings';
import { AlertCategory, AlertClassesUpdate, AlertClassSettings } from 'app/interfaces/alert.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-alert-config-form',
  templateUrl: './alert-config-form.component.html',
  styleUrls: ['./alert-config-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertConfigFormComponent implements OnInit {
  categories: AlertCategory[] = [];
  selectedCategory: AlertCategory;
  form = this.formBuilder.group({});
  isFormLoading = false;
  readonly helptext = helptext;

  readonly trackById = trackById;

  readonly levelOptions$ = of([
    { label: this.translate.instant('INFO'), value: AlertLevel.Info },
    { label: this.translate.instant('NOTICE'), value: AlertLevel.Notice },
    { label: this.translate.instant('WARNING'), value: AlertLevel.Warning },
    { label: this.translate.instant('ERROR'), value: AlertLevel.Error },
    { label: this.translate.instant('CRITICAL'), value: AlertLevel.Critical },
    { label: this.translate.instant('ALERT'), value: AlertLevel.Alert },
    { label: this.translate.instant('EMERGENCY'), value: AlertLevel.Emergency },
  ]);

  readonly policyOptions$ = this.ws.call('alert.list_policies').pipe(
    map((policyList) => {
      return policyList.map((policy) => ({ label: policy, value: policy }));
    }),
  );

  constructor(
    private ws: WebSocketService,
    public dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    protected translate: TranslateService,
    private snackbarService: SnackbarService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;

    this.ws.call('alert.list_categories').pipe(untilDestroyed(this)).subscribe({
      next: (categories) => {
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
        this.cdr.markForCheck();

        this.ws.call('alertclasses.config').pipe(untilDestroyed(this)).subscribe(
          {
            next: (alertConfig) => {
              this.form.patchValue(alertConfig.classes);
              this.isFormLoading = false;
              this.cdr.markForCheck();
            },
            error: (error: WebsocketError) => {
              this.isFormLoading = false;
              this.cdr.markForCheck();
              this.dialogService.error(this.errorHandler.parseWsError(error));
            },
          },
        );
      },
      error: (error: WebsocketError) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
  }

  onCategoryChanged(category: AlertCategory): void {
    this.selectedCategory = category;
  }

  onSubmit(): void {
    this.isFormLoading = true;
    const payload: AlertClassesUpdate = { classes: {} };
    Object.entries(this.form.controls)
      .forEach(([className, classControl]: [string, FormGroup<ControlsOf<AlertClassSettings>>]) => {
        const levelControl = classControl.controls.level;
        const policyControl = classControl.controls.policy;
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

    this.ws.call('alertclasses.update', [payload]).pipe(
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe(() => {
      this.snackbarService.success(this.translate.instant('Settings saved.'));
      this.cdr.markForCheck();
    }).add(() => {
      this.isFormLoading = false;
      this.cdr.markForCheck();
    });
  }
}
