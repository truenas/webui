import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { OldSlideInRef } from 'app/modules/slide-ins/old-slide-in-ref';
import { AuthService } from 'app/services/auth/auth.service';

/**
 * @deprecated Use SlideIn and ix-modal-header.
 */
@Component({
  selector: 'ix-old-modal-header',
  templateUrl: './old-modal-header.component.html',
  styleUrls: ['./old-modal-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReadOnlyComponent,
    IxIconComponent,
    MatProgressBar,
    AsyncPipe,
    TranslateModule,
  ],
})
export class OldModalHeaderComponent {
  readonly title = input<string>();
  readonly loading = input<boolean>();
  readonly disableClose = input(false);
  readonly requiredRoles = input<Role[]>([]);

  readonly hasRequiredRoles = computed(() => this.authService.hasRole(this.requiredRoles()));

  constructor(
    private slideInRef: OldSlideInRef<OldModalHeaderComponent>,
    private authService: AuthService,
  ) {}

  close(): void {
    this.slideInRef.close();
  }
}
