import {
  ChangeDetectorRef,
  Directive, effect, input, TemplateRef, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { distinctUntilChanged } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Directive({
  selector: '[ixHasRole]',
  standalone: true,
})
export class HasRoleDirective {
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

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}
}
