import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable, of } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { DockerStore } from 'app/pages/apps/store/docker.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-select-pool-dialog',
  templateUrl: './select-pool-dialog.component.html',
  styleUrls: ['./select-pool-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectPoolDialogComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];

  form = this.formBuilder.group({
    pool: [''],
    migrateApplications: [false],
  });

  pools$: Observable<Option[]>;
  selectedPool: string;

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private dialogService: DialogService,
    private appService: ApplicationsService,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<SelectPoolDialogComponent>,
    private snackbar: SnackbarService,
    private dockerStore: DockerStore,
  ) {
    this.dockerStore.dockerStatusEventUpdates().pipe(untilDestroyed(this)).subscribe();
  }

  get canMigrateApplications(): boolean {
    return Boolean(this.selectedPool) && this.selectedPool !== this.form.value.pool;
  }

  ngOnInit(): void {
    this.loadPools();
  }

  onSubmit(): void {
    this.dialogService.jobDialog(
      this.ws.job('docker.update', { pool: this.form.value.pool }),
      { title: helptextApps.choosePool.jobTitle },
    )
      .afterClosed()
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe(() => {
        this.snackbar.success(
          this.translate.instant('Using pool {name}', { name: this.form.value.pool }),
        );
        this.dockerStore.setDockerPool(this.form.value.pool);
        this.dialogRef.close(true);
      });
  }

  private loadPools(): void {
    forkJoin(([
      toObservable(this.dockerStore.selectedPool),
      this.appService.getPoolList(),
    ]))
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: ([selectedPool, pools]) => {
          this.selectedPool = selectedPool;
          this.form.patchValue({
            pool: this.selectedPool,
          });

          const poolOptions = pools.map((pool) => ({
            label: pool.name,
            value: pool.name,
          }));
          this.pools$ = of(poolOptions);

          if (!pools.length) {
            this.showNoPoolsWarning();
          }
        },
        error: (error) => {
          this.errorHandler.showErrorModal(error);
          this.dialogRef.close(false);
        },
      });
  }

  private showNoPoolsWarning(): void {
    this.dialogService.confirm({
      title: helptextApps.noPool.title,
      message: helptextApps.noPool.message,
      hideCheckbox: true,
      buttonText: helptextApps.noPool.action,
    }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
      this.dialogRef.close(false);
      if (!confirmed) {
        return;
      }
      this.router.navigate(['/storage', 'create']);
    });
  }
}
