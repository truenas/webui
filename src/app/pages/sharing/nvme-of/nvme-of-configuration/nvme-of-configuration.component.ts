import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize, forkJoin } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-nvme-of-configuration',
  templateUrl: './nvme-of-configuration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    TranslateModule,
    IxFieldsetComponent,
    IxInputComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxCheckboxComponent,
    FormActionsComponent,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
    MatTooltip,
  ],
})
export class NvmeOfConfigurationComponent implements OnInit {
  slideInRef = inject<SlideInRef<void, boolean>>(SlideInRef);
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private nvmeOfService = inject(NvmeOfService);
  private store$ = inject<Store<AppState>>(Store);

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];
  protected isLoading = signal(false);
  protected readonly isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));

  protected form = this.formBuilder.nonNullable.group({
    basenqn: [''],
    ana: [false],
    rdma: [false],
  });

  protected readonly helptext = helptextNvmeOf;

  ngOnInit(): void {
    this.loadConfiguration();
  }

  private loadConfiguration(): void {
    this.isLoading.set(true);

    forkJoin([
      this.api.call('nvmet.global.config'),
      this.nvmeOfService.isRdmaEnabled(),
    ]).pipe(
      this.errorHandler.withErrorHandler(),
      finalize(() => this.isLoading.set(false)),
      untilDestroyed(this),
    ).subscribe(([config, isRdmaEnabled]) => {
      this.form.patchValue(config);

      if (!isRdmaEnabled) {
        this.form.controls.rdma.disable();
      }

      if (!this.isHaLicensed()) {
        this.form.controls.ana.disable();
      }
    });
  }

  protected onSubmit(): void {
    this.isLoading.set(true);

    const payload = this.form.value;

    this.api.call('nvmet.global.update', [payload]).pipe(
      this.errorHandler.withErrorHandler(),
      finalize(() => this.isLoading.set(false)),
      untilDestroyed(this),
    ).subscribe(() => {
      this.snackbar.success(this.translate.instant('Global configuration updated.'));
      this.slideInRef.close({
        response: true,
      });
    });
  }
}
