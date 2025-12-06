import {
  ChangeDetectionStrategy, Component, OnInit, signal, inject, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextServiceWebshare } from 'app/helptext/services/components/service-webshare';
import { WebShareConfig } from 'app/interfaces/webshare-config.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-service-webshare',
  templateUrl: './service-webshare.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    TranslateModule,
    RequiresRolesDirective,
  ],
})
export class ServiceWebshareComponent implements OnInit {
  protected readonly requiredRoles = [Role.SharingWrite];

  private api = inject(ApiService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private fb = inject(NonNullableFormBuilder);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  slideInRef = inject(SlideInRef<undefined, boolean>);

  protected isFormLoading = signal(false);

  form = this.fb.group({
    search: [false],
  });

  readonly helptext = helptextServiceWebshare;


  ngOnInit(): void {
    this.isFormLoading.set(true);
    this.api.call('webshare.config').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (config: WebShareConfig) => {
        this.form.patchValue({
          search: config.search,
        });
        this.isFormLoading.set(false);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }

  onSubmit(): void {
    const values = this.form.value;

    this.isFormLoading.set(true);
    this.api.call('webshare.update', [values]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isFormLoading.set(false);
        this.snackbar.success(this.translate.instant('Service configuration saved'));
        this.slideInRef.close({ response: true, error: null });
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
