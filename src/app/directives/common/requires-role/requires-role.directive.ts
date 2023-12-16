import { Directive, HostBinding, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Directive({
  selector: '[ixMatButtonRoles]',
  // host: {
  //   '[attr.disabled]': 'disabled || null',
  //   '[class.mat-button-disabled]': 'disabled',
  // },
})
export class RequiresRoleDirective {
  protected _elementClass: string[] = [];
  private hasRole = true;

  // @HostBinding('attr.disabled')
  // private attrDisabled: boolean;

  // @HostBinding('class.mat-button-disabled')
  // private classMatButtonDisabled: boolean;

  @Input() set disabled(disabled: boolean) {
    if (!this.hasRole) {
      this._elementClass.push('role-missing');
      this.button.disabled = true;
      // this.attrDisabled = true;
      // this.classMatButtonDisabled = true;
      return;
    }
    this.button.disabled = disabled;
  }

  @Input() set ixMatButtonRoles(roles: Role[]) {
    this.authService.hasRole(roles).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (hasRole) => {
        this.hasRole = hasRole;
        if (!hasRole) {
          this._elementClass.push('role-missing');
          this.button.disabled = true;
        }
      },
    });
  }

  @Input('class')
  @HostBinding('class')
  get elementClass(): string {
    return this._elementClass.join(' ');
  }
  set elementClass(val: string) {
    this._elementClass = val.split(' ');
  }

  constructor(
    private button: MatButton,
    private authService: AuthService,
  ) { }
}
