import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal,
} from '@angular/core';
import {
  FormBuilder, FormControl, Validators, ReactiveFormsModule, FormGroup,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  forkJoin, of, take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { RdmaProtocolName, ServiceName } from 'app/enums/service-name.enum';
import { helptextIscsi } from 'app/helptext/sharing';
import { IscsiGlobalConfigUpdate } from 'app/interfaces/iscsi-global-config.interface';
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
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-global-target-configuration',
  templateUrl: './global-target-configuration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  form = this.fb.nonNullable.group({
    basename: ['', Validators.required],
    isns_servers: [[] as string[]],
    pool_avail_threshold: [null as number | null],
    listen_port: [null as number | null, Validators.required],
    alua: [false],
    iser: [false],
  }) as FormGroup<{
    basename: FormControl<string>;
    isns_servers: FormControl<string[]>;
    pool_avail_threshold: FormControl<number | null>;
    listen_port: FormControl<number | null>;
    alua?: FormControl<boolean>;
    iser: FormControl<boolean>;
  }>;

  readonly tooltips = {
    basename: helptextIscsi.config.basenameTooltip,
    isns_servers: helptextIscsi.config.isnsServersTooltip,
    pool_avail_threshold: helptextIscsi.config.alertThreshold,
    alua: helptextIscsi.config.aluaTooltip,
    iser: helptextIscsi.config.iserTooltip,
  };

  protected readonly requiredRoles = [Role.SharingIscsiGlobalWrite];

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    public slideInRef: SlideInRef<undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    this.loadFormValues();
    this.listenForHaStatus();
    this.checkForRdmaSupport();
  }

  onSubmit(): void {
    this.isLoading.set(true);
    const values = { ...this.form.value } as IscsiGlobalConfigUpdate;

    this.api.call('iscsi.global.update', [values])
      .pipe(untilDestroyed(this))
      .subscribe({
        complete: () => {
          this.isLoading.set(false);
          this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Iscsi }));
          this.slideInRef.close({ response: true, error: null });
          this.snackbar.success(this.translate.instant('Settings saved.'));
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.formErrorHandler.handleValidationErrors(error, this.form);
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
        this.errorHandler.showErrorModal(error);
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
        this.form.addControl('alua', new FormControl(false, { nonNullable: true }));
      }

      this.cdr.markForCheck();
    });
  }

  private checkForRdmaSupport(): void {
    forkJoin([
      this.api.call('rdma.capable_protocols'),
      this.store$.select(selectIsEnterprise).pipe(take(1)),
    ]).pipe(
      untilDestroyed(this),
    ).subscribe(([capableProtocols, isEnterprise]) => {
      const hasRdmaSupport = capableProtocols.includes(RdmaProtocolName.Iser) && isEnterprise;
      if (hasRdmaSupport) {
        this.form.controls.iser.enable();
      } else {
        this.form.controls.iser.disable();
      }
    });
  }
}
