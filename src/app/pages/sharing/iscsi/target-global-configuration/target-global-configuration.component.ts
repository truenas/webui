import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import {
  EMPTY, forkJoin, Observable,
} from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextSharingIscsi, shared } from 'app/helptext/sharing';
import { IscsiGlobalConfigUpdate } from 'app/interfaces/iscsi-global-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-target-global-configuration',
  templateUrl: './target-global-configuration.component.html',
  styleUrls: ['./target-global-configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetGlobalConfigurationComponent implements OnInit {
  isFormLoading = false;
  areSettingsSaved = false;
  isHaSystem = false;

  form = this.fb.group({
    basename: ['', Validators.required],
    isns_servers: [[] as string[]],
    pool_avail_threshold: [null as number],
    listen_port: [null as number, Validators.required],
    alua: [false],
  });

  readonly tooltips = {
    basename: helptextSharingIscsi.globalconf_tooltip_basename,
    isns_servers: helptextSharingIscsi.globalconf_tooltip_isns_servers,
    pool_avail_threshold: helptextSharingIscsi.globalconf_tooltip_pool_avail_threshold,
    alua: helptextSharingIscsi.globalconf_tooltip_alua,
  };

  constructor(
    private ws: WebSocketService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
  ) {}

  ngOnInit(): void {
    this.loadFormValues();
    this.listenForHaStatus();
  }

  onSubmit(): void {
    this.areSettingsSaved = false;
    this.setLoading(true);
    const values = this.form.value as IscsiGlobalConfigUpdate;

    this.ws.call('iscsi.global.update', [values])
      .pipe(
        switchMap(() => this.checkIfServiceShouldBeEnabled()),
        untilDestroyed(this),
      )
      .subscribe({
        complete: () => {
          this.setLoading(false);
          this.areSettingsSaved = true;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.setLoading(false);
          this.formErrorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }

  private loadFormValues(): void {
    this.setLoading(true);

    this.ws.call('iscsi.global.config').pipe(untilDestroyed(this)).subscribe({
      next: (config) => {
        this.form.patchValue(config);
        this.setLoading(false);
      },
      error: (error: WebsocketError) => {
        this.dialogService.error(this.errorHandler.parseWsError(error));
        this.setLoading(false);
      },
    });
  }

  private checkIfServiceShouldBeEnabled(): Observable<unknown> {
    return this.ws.call('service.query').pipe(
      switchMap((services) => {
        const service = _.find(services, { service: ServiceName.Iscsi });
        if (service.enable) {
          return EMPTY;
        }

        return this.dialogService.confirm({
          title: shared.dialog_title,
          message: shared.dialog_message,
          hideCheckbox: true,
          buttonText: shared.dialog_button,
        }).pipe(
          filter(Boolean),
          switchMap(() => forkJoin([
            this.ws.call('service.update', [service.id, { enable: true }]),
            this.ws.call('service.start', [service.service, { silent: false }]),
          ])),
          tap(() => {
            this.snackbar.success(
              this.translate.instant('The {service} service has been enabled.', { service: 'iSCSI' }),
            );
          }),
          this.errorHandler.catchError(),
        );
      }),
    );
  }

  private setLoading(value: boolean): void {
    this.isFormLoading = value;
    this.cdr.markForCheck();
  }

  private listenForHaStatus(): void {
    this.store$.select(selectIsHaLicensed).pipe(untilDestroyed(this)).subscribe((isHa) => {
      this.isHaSystem = isHa;

      if (!isHa) {
        this.form.removeControl('alua');
      }

      if (isHa && !this.form.controls.alua) {
        this.form.addControl('alua', new FormControl(false));
      }

      this.cdr.markForCheck();
    });
  }
}
