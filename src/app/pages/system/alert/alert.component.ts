import {
  AfterViewInit, Component, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertPolicy } from 'app/enums/alert-policy.enum';
import helptext from 'app/helptext/system/alert-settings';
import { AlertCategory, AlertClassesUpdate, AlertClassSettings } from 'app/interfaces/alert.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService, WebSocketService } from 'app/services/';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  selector: 'ix-system-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertConfigComponent implements OnInit, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  categories: AlertCategory[] = [];
  selectedCategory = '';
  form = this.formBuilder.group({});
  readonly helptext = helptext;

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
    protected loader: AppLoaderService,
    public dialog: DialogService,
    protected translate: TranslateService,
    private layoutService: LayoutService,
    private snackbarService: SnackbarService,
    private formBuilder: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.loader.open();

    this.ws.call('alert.list_categories').pipe(untilDestroyed(this)).subscribe((categories) => {
      this.categories = categories;

      if (categories.length) {
        this.selectedCategory = categories[0].id;
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

      this.ws.call('alertclasses.config').pipe(untilDestroyed(this)).subscribe(
        (alertConfig) => {
          this.form.patchValue(alertConfig.classes);
          this.loader.close();
        },
        (error: WebsocketError) => {
          this.loader.close();
          new EntityUtils().handleWsError(this, error, this.dialog);
        },
      );
    },
    (error: WebsocketError) => {
      this.loader.close();
      new EntityUtils().handleWsError(this, error, this.dialog);
    });
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  onCategoryChanged(categotyId: string): void {
    this.selectedCategory = categotyId;
  }

  onSubmit(): void {
    const payload: AlertClassesUpdate = { classes: {} };
    for (const [className, classControl] of Object.entries(this.form.controls)) {
      const levelControl = classControl.controls.level as FormControl;
      const policyControl = classControl.controls.policy as FormControl;
      if (levelControl.value !== levelControl.defaultValue || policyControl.value !== policyControl.defaultValue) {
        payload.classes[className] = {};
        if (levelControl.value !== levelControl.defaultValue) {
          payload.classes[className].level = levelControl.value;
        }
        if (policyControl.value !== policyControl.defaultValue) {
          payload.classes[className].policy = policyControl.value;
        }
      }
    }
    this.loader.open();

    this.ws.call('alertclasses.update', [payload]).pipe(untilDestroyed(this)).subscribe(
      () => this.snackbarService.success(this.translate.instant('Settings saved')),
      (error) => new EntityUtils().handleWsError(this, error, this.dialog),
    ).add(() => this.loader.close());
  }
}
