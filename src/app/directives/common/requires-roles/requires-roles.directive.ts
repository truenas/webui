import {
  ComponentRef, Directive, HostBinding, Input, OnDestroy, TemplateRef, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { RequiresRolesWrapperComponent } from 'app/directives/common/requires-roles/requires-roles-wrapper.component';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Directive({
  selector: '[ixRequiresRoles]',
})
export class RequiresRolesDirective implements OnDestroy {
  private wrapperContainer: ComponentRef<RequiresRolesWrapperComponent>;

  @Input()
  set ixRequiresRoles(roles: Role[]) {
    this.authService.hasRole(roles).pipe(untilDestroyed(this)).subscribe({
      next: (hasRole) => {
        if (!hasRole) {
          this.wrapperContainer = this.viewContainerRef.createComponent(RequiresRolesWrapperComponent);
          this.wrapperContainer.instance.template = this.templateRef;
          this.wrapperContainer.instance.class = this.elementClass;

          const form = this.getClosestForm();

          if (form) {
            form.addEventListener('keydown', this.preventFormEnter.bind(this));
          }
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

  ngOnDestroy(): void {
    if (this.wrapperContainer) {
      const form = this.getClosestForm();
      if (form) {
        form.removeEventListener('keydown', this.preventFormEnter.bind(this));
      }
    }
  }

  private getClosestForm(): HTMLFormElement | null {
    const hostView = this.wrapperContainer.hostView;
    const rootNode: HTMLElement = (hostView as unknown as { rootNodes: HTMLElement[] }).rootNodes[0];
    return rootNode.closest('form');
  }

  private preventFormEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  }
}
