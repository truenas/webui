import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { EMPTY, Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideToggleComponent } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { ModalHeader2Component } from 'app/modules/slide-ins/components/modal-header2/modal-header2.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { FipsService } from 'app/services/fips.service';
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
    ModalHeader2Component,
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
    private fips: FipsService,
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
        switchMap(() => this.promptForRestart()),
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

  private promptForRestart(): Observable<unknown> {
    return this.isHaLicensed$
      .pipe(
        take(1),
        switchMap((isHaLicensed) => {
          if (isHaLicensed) {
            // Restart will be handled in response to failover.disabled.reasons event in HaFipsEffects.
            return EMPTY;
          }

          return this.fips.promptForRestart();
        }),
      );
  }
}
