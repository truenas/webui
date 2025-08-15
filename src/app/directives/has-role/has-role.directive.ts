import { ChangeDetectorRef, Directive, effect, input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { distinctUntilChanged } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';

@UntilDestroy()
@Directive({
  selector: '[ixHasRole]',
})
export class HasRoleDirective {
  private templateRef = inject<TemplateRef<unknown>>(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  readonly roles = input.required<Role[]>({
    alias: 'ixHasRole',
  });

  private readonly updateView = effect(() => {
    this.authService.hasRole(this.roles()).pipe(
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((hasRole) => {
      this.viewContainer.clear();
      if (hasRole) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }

      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  });
}
