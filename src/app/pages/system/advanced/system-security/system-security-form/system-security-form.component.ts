import {
  ChangeDetectionStrategy, Component, OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatHint } from '@angular/material/form-field';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { map, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { PasswordComplexityRuleset, passwordComplexityRulesetLabels } from 'app/enums/password-complexity-ruleset.enum';
import { Role } from 'app/enums/role.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
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
    IxInputComponent,
    IxSelectComponent,
  ],
})
export class SystemSecurityFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.SystemSecurityWrite];

  form = this.formBuilder.group({
    enable_fips: [false],
    enable_gpos_stig: [false],
    min_password_age: [null as number | null, [Validators.min(1), Validators.max(365)]],
    max_password_age: [null as number | null, [Validators.min(7), Validators.max(365)]],
    password_complexity_ruleset: [null as PasswordComplexityRuleset[] | null],
    min_password_length: [null as number | null, [Validators.min(8), Validators.max(128)]],
    password_history_length: [null as number | null, [Validators.required, Validators.min(1), Validators.max(10)]],
  });

  complexityRulesetLabels$ = of(passwordComplexityRulesetLabels).pipe(
    map((rulesets) => mapToOptions(rulesets, this.translate)),
  );

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
    const values = this.form.value as unknown as SystemSecurityConfig;

    if (values.password_complexity_ruleset) {
      values.password_complexity_ruleset = {
        $set: values.password_complexity_ruleset as unknown as PasswordComplexityRuleset[],
      };
    }

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
    this.form.patchValue({
      ...this.systemSecurityConfig(),
      password_complexity_ruleset: this.systemSecurityConfig().password_complexity_ruleset?.$set,
    });
    this.form.controls.enable_gpos_stig.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((value) => {
        this.form.patchValue({ enable_fips: value });
      });
  }
}
