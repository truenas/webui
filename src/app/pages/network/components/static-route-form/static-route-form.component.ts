import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import helptext from 'app/helptext/network/static-routes/static-routes';
import { StaticRoute, UpdateStaticRoute } from 'app/interfaces/static-route.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { ipv4or6Validator } from 'app/modules/ix-forms/validators/ip-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './static-route-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaticRouteFormComponent implements OnInit {
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
    destination: helptext.sr_destination_tooltip,
    gateway: helptext.sr_gateway_tooltip,
    description: helptext.sr_description_tooltip,
  };

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private errorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private slideInRef: IxSlideInRef<StaticRouteFormComponent>,
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
        this.slideInRef.close();
      },
      error: (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
      },
    });
  }
}
