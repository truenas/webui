import {
  ChangeDetectorRef, Directive, Input, TemplateRef, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { distinctUntilChanged } from 'rxjs';
import { ActionHasRoleWrapperComponent } from 'app/directives/common/action-has-role/action-has-role-wrapper.component';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Directive({ selector: '[ixActionHasRole]' })
export class ActionHasRoleDirective {
  @Input() set ixActionHasRole(roles: Role[]) {
    this.authService.hasRole(roles).pipe(
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((hasRole) => {
      if (!hasRole) {
        const templateView = this.viewContainer.createEmbeddedView(this.templateRef);
        this.viewContainer.createComponent(ActionHasRoleWrapperComponent, {
          projectableNodes: [templateView.rootNodes as Node[]],
        });
      }

      this.cdr.markForCheck();
    });
  }

  constructor(
    private viewContainer: ViewContainerRef,
    private templateRef: TemplateRef<unknown>,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) { }
}
