import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { FipsService } from 'app/services/fips.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-system-security-form',
  templateUrl: './system-security-form.component.html',
  styleUrls: ['./system-security-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    private matDialog: MatDialog,
    private fips: FipsService,
    private store$: Store<AppState>,
  ) {
    this.systemSecurityConfig = this.chainedRef.getData();
  }

  ngOnInit(): void {
    if (this.systemSecurityConfig) {
      this.initSystemSecurityForm();
    }
  }

  onSubmit(): void {
    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: { title: this.translate.instant('Saving settings') },
      disableClose: true,
    });
    dialogRef.componentInstance.setCall('system.security.update', [this.form.value as SystemSecurityConfig]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.promptForRestart();
      this.chainedRef.close({ response: true, error: null });
      dialogRef.close();
      this.snackbar.success(this.translate.instant('System Security Settings Updated.'));
    });
  }

  private initSystemSecurityForm(): void {
    this.form.patchValue(this.systemSecurityConfig);
    this.cdr.markForCheck();
  }

  private promptForRestart(): void {
    this.isHaLicensed$
      .pipe(
        take(1),
        switchMap((isHaLicensed) => {
          if (isHaLicensed) {
            // Reboot will be handled in response to failover.disabled.reasons event in HaFipsEffects.
            return EMPTY;
          }

          return this.fips.promptForRestart();
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }
}
