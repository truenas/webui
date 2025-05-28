import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, take } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { OverlaySlideInService } from 'app/modules/overlay-slide-ins/overlay-slide-in.service';
import { SlideInOverlayRef } from 'app/modules/overlay-slide-ins/slide-in-overlay-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-modal-header',
  templateUrl: './modal-header.component.html',
  styleUrls: ['./modal-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class ModalHeaderComponent {
  readonly title = input<string>('');
  readonly loading = input<boolean>();
  readonly disableClose = input(false);
  readonly requiredRoles = input<Role[]>([]);

  protected readonly componentsSize$ = toObservable(this.slideInOverlay.openOverlays).pipe(take(1));

  get hasRequiredRoles(): Observable<boolean> {
    return this.authService.hasRole(this.requiredRoles());
  }

  protected tooltip = computed<string>(() => {
    const overlaysCount = this.slideInOverlay.openOverlays();
    if (overlaysCount > 1) {
      return this.translate.instant('Go back to the previous form');
    }
    return this.translate.instant('Close the form');
  });

  constructor(
    private translate: TranslateService,
    private slideInRef: SlideInOverlayRef,
    private authService: AuthService,
    private slideInOverlay: OverlaySlideInService,
  ) {}

  close(): void {
    this.slideInRef.close({ response: false, error: null });
  }
}
