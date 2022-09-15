import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable, of } from 'rxjs';
import helptext from 'app/helptext/apps/apps';
import { KubernetesConfigUpdate } from 'app/interfaces/kubernetes-config.interface';
import { Option } from 'app/interfaces/option.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApplicationsService } from 'app/pages/applications/applications.service';
import { AppLoaderService, DialogService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './select-pool-dialog.component.html',
  styleUrls: ['./select-pool-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectPoolDialogComponent implements OnInit {
  form = this.formBuilder.group({
    pool: [''],
    migrateApplications: [false],
  });

  pools$: Observable<Option[]>;
  selectedPool: string;

  constructor(
    private formBuilder: FormBuilder,
    private dialogService: DialogService,
    private appService: ApplicationsService,
    private router: Router,
    private matDialog: MatDialog,
    private loader: AppLoaderService,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<SelectPoolDialogComponent>,
    private snackbar: SnackbarService,
  ) {}

  get canMigrateApplications(): boolean {
    return Boolean(this.selectedPool)
      && this.selectedPool !== this.form.value.pool;
  }

  ngOnInit(): void {
    this.loadPools();
  }

  onSubmit(): void {
    const params: Partial<KubernetesConfigUpdate> = {
      pool: this.form.value.pool,
    };

    if (this.form.value.migrateApplications) {
      params['migrate_applications'] = true;
    }

    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: {
        title: helptext.choosePool.jobTitle,
      },
    });
    dialogRef.componentInstance.setCall('kubernetes.update', [params]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.snackbar.success(
        this.translate.instant('Using pool {name}', { name: this.form.value.pool }),
      );
      dialogRef.close();
      this.dialogRef.close(true);
    });
  }

  private loadPools(): void {
    this.loader.open();

    forkJoin(([
      this.appService.getKubernetesConfig(),
      this.appService.getPoolList(),
    ]))
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ([config, pools]) => {
          this.loader.close();
          this.selectedPool = config.pool;
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
          this.loader.close();
          new EntityUtils().handleWsError(this, error, this.dialogService);
          this.dialogRef.close(false);
        },
      });
  }

  private showNoPoolsWarning(): void {
    this.dialogService.confirm({
      title: helptext.noPool.title,
      message: helptext.noPool.message,
      hideCheckBox: true,
      buttonMsg: helptext.noPool.action,
    }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
      this.dialogRef.close(false);
      if (!confirmed) {
        return;
      }
      this.router.navigate(['/storage', 'create']);
    });
  }
}
