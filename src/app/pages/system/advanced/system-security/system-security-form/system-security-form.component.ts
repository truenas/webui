import {
  ChangeDetectionStrategy, Component, OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatHint } from '@angular/material/form-field';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideToggleComponent } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-system-security-form',
  templateUrl: './system-security-form.component.html',
  styleUrls: ['./system-security-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxSlideToggleComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    MatHint,
  ],
})
export class SystemSecurityFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.SystemSecurityWrite];

  form = this.formBuilder.group({
    enable_fips: [false],
    enable_gpos_stig: [false],
  });

  private systemSecurityConfig = signal<SystemSecurityConfig>(this.slideInRef.getData());

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialogService: DialogService,
    private api: ApiService,
    private authService: AuthService,
    private errorHandler: ErrorHandlerService,
    public slideInRef: SlideInRef<SystemSecurityConfig, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    if (this.systemSecurityConfig()) {
      this.initSystemSecurityForm();
    }
  }

  onSubmit(): void {
    const values = this.form.value as SystemSecurityConfig;
    this.dialogService.jobDialog(
      this.api.job('system.security.update', [values]),
      {
        title: this.translate.instant('Saving settings'),
      },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        if (values.enable_gpos_stig) {
          this.authService.clearAuthToken();
        }

        this.slideInRef.close({ response: true, error: null });
        this.snackbar.success(this.translate.instant('System Security Settings Updated.'));
      });
  }

  private initSystemSecurityForm(): void {
    this.form.patchValue(this.systemSecurityConfig());
    this.form.controls.enable_gpos_stig.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((value) => {
        this.form.patchValue({ enable_fips: value });
      });
  }
}
