import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
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
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-nvme-of-configuration',
  templateUrl: './nvme-of-configuration.component.html',
  styleUrls: ['./nvme-configuration.component.scss'],
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
  ],
})
export class NvmeOfConfigurationComponent implements OnInit {
  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];
  protected isLoading = signal(false);

  protected form = this.formBuilder.nonNullable.group({
    basenqn: [''],
    ana: [false],
    rdma: [false],
    xport_referral: [false],
  });

  constructor(
    public slideInRef: SlideInRef<void, boolean>,
    private formBuilder: FormBuilder,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
  ) {}

  protected readonly helptext = helptextNvmeOf;

  ngOnInit(): void {
    this.loadConfiguration();
  }

  private loadConfiguration(): void {
    this.isLoading.set(true);

    this.api.call('nvmet.global.config').pipe(
      this.errorHandler.withErrorHandler(),
      finalize(() => this.isLoading.set(false)),
      untilDestroyed(this),
    ).subscribe((config) => {
      this.form.patchValue(config);
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
        error: null,
      });
    });
  }
}
