import {
  ComponentRef, Directive, HostBinding, Input, TemplateRef, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { RequiresRolesWrapperComponent } from 'app/directives/common/requires-roles/requires-roles-wrapper.component';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Directive({
  selector: '[ixRequiresRoles]',
})
export class RequiresRolesDirective {
  private wrapperContainer: ComponentRef<RequiresRolesWrapperComponent>;

  @Input()
  set ixRequiresRoles(roles: Role[]) {
    this.authService.hasRole(roles).pipe(untilDestroyed(this)).subscribe({
      next: (hasRole) => {
        if (!hasRole && roles?.length) {
          this.wrapperContainer = this.viewContainerRef.createComponent(RequiresRolesWrapperComponent);
          this.wrapperContainer.instance.template = this.templateRef;
          this.wrapperContainer.instance.class = this.elementClass;
        } else {
          this.viewContainerRef.createEmbeddedView(this.templateRef);
        }
      },
    });
  }

  protected cssClassList: string[] = [];

  @Input('class')
  @HostBinding('class')
  get elementClass(): string {
    return this.cssClassList.join(' ');
  }
  set(val: string): void {
    this.cssClassList = val.split(' ');
  }

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainerRef: ViewContainerRef,
    private authService: AuthService,
  ) { }
}
