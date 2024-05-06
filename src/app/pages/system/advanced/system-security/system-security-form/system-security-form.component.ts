import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
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
  protected requiredRoles = [Role.FullAdmin];

  form = this.formBuilder.group({
    enable_fips: [false],
  });

  private isHaLicensed$ = this.store$.select(selectIsHaLicensed);

  constructor(
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private slideInRef: IxSlideInRef<SystemSecurityFormComponent>,
    private matDialog: MatDialog,
    private fips: FipsService,
    private store$: Store<AppState>,
    @Inject(SLIDE_IN_DATA) private systemSecurityConfig: SystemSecurityConfig,
  ) {}

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
    dialogRef.componentInstance.success.pipe(
      switchMap(() => this.promptForRestart()),
      untilDestroyed(this),
    ).subscribe(() => {
      this.slideInRef.close();
      dialogRef.close();
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
            // Reboot will be handled in response to failover.disabled.reasons event in HaFipsEffects.
            return EMPTY;
          }

          return this.fips.promptForRestart();
        }),
      );
  }
}
