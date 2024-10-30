import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { WarnAboutUnsavedChangesDirective } from 'app/directives/warn-about-unsaved-changes/warn-about-unsaved-changes.directive';
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
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WebSocketService } from 'app/services/ws.service';

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
    WarnAboutUnsavedChangesDirective,
  ],
})
export class StaticRouteFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];

  get isNew(): boolean {
    return !this.editingRoute;
  }

  get title(): string {
    return this.isNew ? this.translate.instant('Add Static Route') : this.translate.instant('Edit Static Route');
  }

  isFormLoading = false;

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
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private errorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private slideInRef: SlideInRef<StaticRouteFormComponent>,
    @Inject(SLIDE_IN_DATA) private editingRoute: StaticRoute,
  ) {}

  ngOnInit(): void {
    if (this.editingRoute) {
      this.setEditingStaticRoute();
    }
  }

  setEditingStaticRoute(): void {
    this.form.patchValue(this.editingRoute);
  }

  onSubmit(): void {
    this.isFormLoading = true;
    const values = this.form.value as UpdateStaticRoute;

    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('staticroute.create', [values]);
    } else {
      request$ = this.ws.call('staticroute.update', [
        this.editingRoute.id,
        values,
      ]);
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
        this.slideInRef.close(true);
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.errorHandler.handleWsFormError(error, this.form);
      },
    });
  }
}
