import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit, ChangeDetectionStrategy, Component, input,
  signal,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-modal-header',
  templateUrl: './modal-header.component.html',
  styleUrls: ['./modal-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconButton,
    MatTooltip,
    IxIconComponent,
    ReadOnlyComponent,
    MatProgressBar,
    AsyncPipe,
    TranslateModule,
    TestDirective,
  ],
})
export class ModalHeaderComponent implements AfterViewInit {
  readonly title = input<string>('');
  readonly loading = input<boolean>();
  readonly disableClose = input(false);
  readonly requiredRoles = input<Role[]>([]);

  protected componentsSize = signal(1);

  get hasRequiredRoles(): Observable<boolean> {
    return this.authService.hasRole(this.requiredRoles());
  }

  tooltip = this.translate.instant('Close the form');

  constructor(
    private translate: TranslateService,
    private slideIn: SlideIn,
    private slideInRef: SlideInRef<unknown, false>,
    private authService: AuthService,
  ) {}

  ngAfterViewInit(): void {
    this.slideIn.components$.pipe(
      untilDestroyed(this),
    ).subscribe((components) => {
      this.componentsSize.set(components.length);
      if (components.length > 1) {
        this.tooltip = this.translate.instant('Go back to the previous form');
      } else {
        this.tooltip = this.translate.instant('Close the form');
      }
    });
  }

  close(): void {
    this.slideInRef.close({ response: false, error: null });
  }
}
