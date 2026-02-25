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
  private slideInRef = inject<SlideInRef<unknown, boolean>>(SlideInRef);
  private destroyRef = inject(DestroyRef);

  protected hasSmbUsers = signal(true);

  ngOnInit(): void {
    this.checkForSmbUsersWarning();
  }

  protected closeForm(routerLink: string[]): void {
    this.slideInRef.close({ response: false });
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
