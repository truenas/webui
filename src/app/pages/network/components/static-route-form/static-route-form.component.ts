import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import helptext from 'app/helptext/network/static-routes/static-routes';
import { StaticRoute, UpdateStaticRoute } from 'app/interfaces/static-route.interface';
import { ipv4or6Validator } from 'app/modules/entity/entity-form/validators/ip-validation';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './static-route-form.component.html',
  styleUrls: ['./static-route-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaticRouteFormComponent {
  private editingRoute: StaticRoute;
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
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private translate: TranslateService,
  ) {}

  setEditingStaticRoute(route: StaticRoute): void {
    this.editingRoute = route;
    this.form.patchValue(route);
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
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInService.close();
      },
      error: (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
      },
    });
  }
}
