import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnIconButtonComponent,
  TnMenuComponent,
  TnMenuTriggerDirective,
  type TnMenuItem,
} from '@truenas/ui-components';
import { of, switchMap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { serviceNames } from 'app/enums/service-name.enum';
import { Service } from 'app/interfaces/service.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  ServiceActionsMenuService,
} from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-actions-menu.service';

@Component({
  selector: 'ix-service-extra-actions',
  templateUrl: './service-extra-actions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TestDirective,
    TnIconButtonComponent,
    TnMenuComponent,
    TnMenuTriggerDirective,
    TranslateModule,
  ],
})
export class ServiceExtraActionsComponent {
  private authService = inject(AuthService);
  private menuBuilder = inject(ServiceActionsMenuService);

  readonly service = input.required<Service>();
  readonly requiredRoles = input<Role[]>([]);
  readonly serviceNames = serviceNames;

  private hasRequiredRole = toSignal(
    toObservable(this.requiredRoles).pipe(
      switchMap((roles) => (roles?.length ? this.authService.hasRole(roles) : of(true))),
    ),
    { initialValue: false },
  );

  protected menuItems = computed<TnMenuItem[]>(() => {
    return this.menuBuilder.buildMenuItems(this.service(), this.hasRequiredRole());
  });
}
