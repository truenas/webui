import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChainedRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/chained-component-ref';
import { IxModalHeader2Component } from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-modal-header2/ix-modal-header2.component';
import { IxSlideToggleComponent } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-system-security-form',
  templateUrl: './system-security-form.component.html',
  styleUrls: ['./system-security-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxModalHeader2Component,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxSlideToggleComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class SystemSecurityFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];

  form = this.formBuilder.group({
    enable_fips: [false],
  });

  private isHaLicensed$ = this.store$.select(selectIsHaLicensed);

  private systemSecurityConfig: SystemSecurityConfig;

  constructor(
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private chainedRef: ChainedRef<SystemSecurityConfig>,
    private store$: Store<AppState>,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
  ) {
    this.systemSecurityConfig = this.chainedRef.getData();
  }

  ngOnInit(): void {
    if (this.systemSecurityConfig) {
      this.initSystemSecurityForm();
    }
  }

  onSubmit(): void {
    this.dialogService.jobDialog(
      this.ws.job('system.security.update', [this.form.value as SystemSecurityConfig]),
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
        this.chainedRef.close({ response: true, error: null });
        this.snackbar.success(this.translate.instant('System Security Settings Updated.'));
      });
  }

  private initSystemSecurityForm(): void {
    this.form.patchValue(this.systemSecurityConfig);
    this.cdr.markForCheck();
  }
}
