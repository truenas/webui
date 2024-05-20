import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
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
  readonly title = input<string>();
  readonly loading = input<boolean>();
  readonly disableClose = input(false);
  readonly requiredRoles = input<Role[]>([]);

  readonly hasRequiredRoles = computed(() => this.authService.hasRole(this.requiredRoles()));

  constructor(
    private slideInRef: IxSlideInRef<IxModalHeaderComponent>,
    private authService: AuthService,
  ) {}

  close(): void {
    this.slideInRef.close();
  }
}
