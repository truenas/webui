import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { AuthService } from 'app/services/auth/auth.service';

@Component({
  selector: 'ix-modal-header',
  templateUrl: './modal-header.component.html',
  styleUrls: ['./modal-header.component.scss'],
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
export class ModalHeaderComponent {
  readonly title = input<string>();
  readonly loading = input<boolean>();
  readonly disableClose = input(false);
  readonly requiredRoles = input<Role[]>([]);

  readonly hasRequiredRoles = computed(() => this.authService.hasRole(this.requiredRoles()));

  constructor(
    private slideInRef: SlideInRef<ModalHeaderComponent>,
    private authService: AuthService,
  ) {}

  close(): void {
    this.slideInRef.close();
  }
}
