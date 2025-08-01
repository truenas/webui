import { ChangeDetectionStrategy, Component, signal, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { SmbValidationService } from 'app/pages/sharing/smb/smb-form/smb-validator.service';

@UntilDestroy()
@Component({
  selector: 'ix-smb-users-warning',
  styleUrls: ['./smb-users-warning.component.scss'],
  templateUrl: './smb-users-warning.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    TestDirective,
    TranslateModule,
  ],
})
export class SmbUsersWarningComponent implements OnInit {
  private router = inject(Router);
  private smbValidationService = inject(SmbValidationService);
  private slideInRef = inject<SlideInRef<unknown, boolean>>(SlideInRef);

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
      untilDestroyed(this),
    ).subscribe((hasWarning) => {
      this.hasSmbUsers.set(!hasWarning);
    });
  }
}
