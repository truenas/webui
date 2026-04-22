import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { helptextStaticRoutes } from 'app/helptext/network/static-routes/static-routes';
import { StaticRoute, UpdateStaticRoute } from 'app/interfaces/static-route.interface';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { FormSubmitEvent, IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { ipv4or6Validator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-static-route-form',
  templateUrl: './static-route-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxFormComponent,
    TranslateModule,
  ],
})
export class StaticRouteFormComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  slideInRef = inject<SlideInRef<StaticRoute | undefined, boolean>>(SlideInRef);

  protected readonly requiredRoles = [Role.NetworkInterfaceWrite];

  protected editingRoute = this.slideInRef.getData();

  protected get title(): string {
    return this.editingRoute
      ? this.translate.instant('Edit Static Route')
      : this.translate.instant('Add Static Route');
  }

  form = this.fb.group({
    destination: ['', [Validators.required]],
    gateway: ['', [Validators.required, ipv4or6Validator()]],
    description: [''],
  });

  protected readonly tooltips = {
    destination: helptextStaticRoutes.destinationTooltip,
    gateway: helptextStaticRoutes.gatewayTooltip,
  };

  protected handleSubmit = (event: FormSubmitEvent<UpdateStaticRoute>): SubmitResult => ({
    request$: this.editingRoute
      ? this.api.call('staticroute.update', [this.editingRoute.id, event.changedValues])
      : this.api.call('staticroute.create', [event.allValues]),
    successMessage: this.editingRoute
      ? this.translate.instant('Static route updated')
      : this.translate.instant('Static route added'),
  });
}
