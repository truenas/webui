import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { AuthService } from 'app/services/auth/auth.service';

@Component({
  selector: 'ix-modal-header',
  templateUrl: './ix-modal-header.component.html',
  styleUrls: ['./ix-modal-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxModalHeaderComponent {
  @Input() title: string;
  @Input() loading: boolean;
  @Input() disableClose = false;
  @Input() requiredRoles: Role[] = [];

  get hasRequiredRoles(): Observable<boolean> {
    return this.authService.hasRole(this.requiredRoles);
  }

  constructor(
    private slideInRef: IxSlideInRef<IxModalHeaderComponent>,
    private authService: AuthService,
  ) {}

  close(): void {
    this.slideInRef.close();
  }
}
