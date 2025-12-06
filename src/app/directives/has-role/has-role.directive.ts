import { ChangeDetectorRef, DestroyRef, Directive, effect, input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';

@Directive({
  selector: '[ixHasRole]',
})
export class HasRoleDirective {
  private readonly destroyRef = inject(DestroyRef);
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
      takeUntilDestroyed(this.destroyRef),
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
