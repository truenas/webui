import {
  Directive, HostBinding, HostListener, Input,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Directive({
  selector: '[ixMatButtonRoles]',
  providers: [MatTooltip],
})
export class RequiresRoleDirective {
  protected _elementClass: string[] = [];
  private hasRole = true;

  @Input() set disabled(disabled: boolean) {
    if (!this.hasRole) {
      this._elementClass.push('role-missing');
      this.button.disabled = true;
      return;
    }
    this.button.disabled = disabled;
  }

  @HostListener('mouseover') mouseover(): void {
    if (!this.hasRole) {
      this.matTooltip.message = 'Role missing';
      this.matTooltip.show();
    }
  }
  @HostListener('mouseleave') mouseleave(): void {
    if (!this.hasRole) {
      this.matTooltip.hide();
    }
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
    private matTooltip: MatTooltip,
    private authService: AuthService,
  ) { }
}
