import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal,
} from '@angular/core';
import {
  FormBuilder, FormControl, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IscsiGlobalConfigUpdate } from 'app/interfaces/iscsi-global-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';

@UntilDestroy()
@Component({
  selector: 'ix-global-target-configuration',
  templateUrl: './global-target-configuration.component.html',
  styleUrls: ['./global-target-configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxChipsComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    ModalHeaderComponent,
  ],
})
export class GlobalTargetConfigurationComponent implements OnInit {
  protected isLoading = signal(false);
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

  readonly requiredRoles = [Role.SharingIscsiGlobalWrite];

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private dialogService: DialogService,
    private slideInRef: SlideInRef<GlobalTargetConfigurationComponent>,
    private snackbar: SnackbarService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadFormValues();
    this.listenForHaStatus();
  }

  onSubmit(): void {
    this.isLoading.set(true);
    const values = this.form.value as IscsiGlobalConfigUpdate;

    this.api.call('iscsi.global.update', [values])
      .pipe(untilDestroyed(this))
      .subscribe({
        complete: () => {
          this.isLoading.set(false);
          this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Iscsi }));
          this.cdr.markForCheck();
          this.slideInRef.close(true);
          this.snackbar.success(this.translate.instant('Settings saved.'));
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.formErrorHandler.handleValidationErrors(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }

  private loadFormValues(): void {
    this.isLoading.set(true);

    this.api.call('iscsi.global.config').pipe(untilDestroyed(this)).subscribe({
      next: (config) => {
        this.form.patchValue(config);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(error));
        this.isLoading.set(false);
      },
    });
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
