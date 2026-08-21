import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconButtonComponent, TnProgressBarComponent, TnTooltipDirective } from '@truenas/ui-components';
import { switchMap, take } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';

/**
 * Header for a form hosted in the legacy {@link SlideIn} overlay. Deliberately mirrors
 * `tn-side-panel`'s own header (title line, trailing close control, top progress bar) so a form
 * still opened through `SlideIn` and one hosted in a `tn-side-panel` read as the same surface
 * while the two hosts coexist. Forms hosted only in a panel do not render this — the panel
 * supplies its own header.
 */
@Component({
  selector: 'ix-modal-header',
  templateUrl: './modal-header.component.html',
  styleUrls: ['./modal-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconButtonComponent,
    TnProgressBarComponent,
    TnTooltipDirective,
    ReadOnlyComponent,
    TranslateModule,
  ],
  standalone: true,
})
export class ModalHeaderComponent {
  private slideInRef = inject<SlideInRef<unknown, unknown>>(SlideInRef);
  private authService = inject(AuthService);
  private slideIn = inject(SlideIn);

  readonly title = input<string>('');
  readonly loading = input<boolean>();
  readonly disableClose = input(false);
  readonly requiredRoles = input<Role[]>([]);

  /**
   * How many slide-ins were open when this header was created. `take(1)` snapshots it: a form
   * opened on top of another keeps reading as "go back" even if the stack changes underneath it.
   */
  private readonly openSlideInsAtCreation = toSignal(
    toObservable(this.slideIn.openSlideIns).pipe(take(1)),
    { initialValue: 0 },
  );

  /** This form was opened over another one, so its close control goes back rather than dismisses. */
  protected readonly isStacked = computed(() => this.openSlideInsAtCreation() > 1);

  private readonly hasRequiredRoles = toSignal(
    toObservable(this.requiredRoles).pipe(
      switchMap((roles) => this.authService.hasRole(roles)),
    ),
    { initialValue: true },
  );

  /** Assumed granted until the role check resolves, so the badge never flashes on an editable form. */
  protected readonly showReadOnlyBadge = computed(() => {
    return this.requiredRoles().length > 0 && !this.hasRequiredRoles();
  });

  protected close(): void {
    this.slideInRef.close({ response: undefined });
  }
}
