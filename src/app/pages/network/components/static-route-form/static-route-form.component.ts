import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextStaticRoutes } from 'app/helptext/network/static-routes/static-routes';
import { StaticRoute, UpdateStaticRoute } from 'app/interfaces/static-route.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ipv4or6Validator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-static-route-form',
  templateUrl: './static-route-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class StaticRouteFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.NetworkInterfaceWrite];

  get isNew(): boolean {
    return !this.editingRoute;
  }

  get title(): string {
    return this.isNew ? this.translate.instant('Add Static Route') : this.translate.instant('Edit Static Route');
  }

  isFormLoading = false;
  protected editingRoute: StaticRoute | undefined;

  form = this.fb.group({
    destination: ['', [Validators.required]],
    gateway: ['', [Validators.required, ipv4or6Validator()]],
    description: [''],
  });

  readonly tooltips = {
    destination: helptextStaticRoutes.sr_destination_tooltip,
    gateway: helptextStaticRoutes.sr_gateway_tooltip,
    description: helptextStaticRoutes.sr_description_tooltip,
  };

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private errorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    public slideInRef: SlideInRef<StaticRoute | undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.editingRoute = this.slideInRef.getData();
  }

  ngOnInit(): void {
    if (this.editingRoute) {
      this.form.patchValue(this.editingRoute);
    }
  }

  onSubmit(): void {
    this.isFormLoading = true;
    const values = this.form.value as UpdateStaticRoute;

    let request$: Observable<unknown>;
    if (this.editingRoute) {
      request$ = this.api.call('staticroute.update', [
        this.editingRoute.id,
        values,
      ]);
    } else {
      request$ = this.api.call('staticroute.create', [values]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        if (this.isNew) {
          this.snackbar.success(this.translate.instant('Static route added'));
        } else {
          this.snackbar.success(this.translate.instant('Static route updated'));
        }
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInRef.close({ response: true, error: null });
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.errorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
