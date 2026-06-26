import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { SmbValidationService } from 'app/pages/sharing/smb/smb-form/smb-validator.service';

@Component({
  selector: 'ix-smb-users-warning',
  styleUrls: ['./smb-users-warning.component.scss'],
  templateUrl: './smb-users-warning.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
    TestDirective,
    TranslateModule,
  ],
})
export class SmbUsersWarningComponent implements OnInit {
  private router = inject(Router);
  private smbValidationService = inject(SmbValidationService);
  // Optional: this warning renders inside SmbFormComponent, which is now hosted both in the legacy
  // SlideIn (SlideInRef present) and in a `<tn-side-panel>` (SlideInRef absent). A non-optional
  // inject would throw NullInjectorError in the panel host and blank the whole form.
  private slideInRef = inject<SlideInRef<unknown, boolean>>(SlideInRef, { optional: true });
  private destroyRef = inject(DestroyRef);

  protected hasSmbUsers = signal(true);

  ngOnInit(): void {
    this.checkForSmbUsersWarning();
  }

  protected closeForm(routerLink: string[]): void {
    // SlideIn host: close the slide-in explicitly. Panel host: navigation tears the panel down via
    // FormSidePanelService's router closeAll, so the optional ref is simply absent here.
    this.slideInRef?.close({ response: undefined });
    this.router.navigate(routerLink);
  }

  private checkForSmbUsersWarning(): void {
    this.smbValidationService.checkForSmbUsersWarning().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((hasWarning) => {
      this.hasSmbUsers.set(!hasWarning);
    });
  }
}
