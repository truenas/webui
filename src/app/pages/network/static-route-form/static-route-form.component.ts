import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import helptext from 'app/helptext/network/static-routes/static-routes';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { ipv4or6Validator } from 'app/pages/common/entity/entity-form/validators/ip-validation';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { WebSocketService } from 'app/services';
import { IxModalService } from 'app/services/ix-modal.service';

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
    private modalService: IxModalService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
  ) {}

  setEditingStaticRoute(route: StaticRoute): void {
    this.editingRoute = route;
    this.form.patchValue(route);
  }

  onSubmit(): void {
    this.isFormLoading = true;
    const values = this.form.value;

    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('staticroute.create', [values]);
    } else {
      request$ = this.ws.call('staticroute.update', [
        this.editingRoute.id,
        values,
      ]);
    }

    request$.pipe(untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = false;
      this.modalService.close();
    }, (error) => {
      this.isFormLoading = false;
      this.errorHandler.handleWsFormError(error, this.form);
    });
  }
}
