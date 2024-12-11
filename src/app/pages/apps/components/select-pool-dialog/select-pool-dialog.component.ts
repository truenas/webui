import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogClose, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  forkJoin, Observable, of, take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-select-pool-dialog',
  templateUrl: './select-pool-dialog.component.html',
  styleUrls: ['./select-pool-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    TranslateModule,
    IxSelectComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
  ],
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
  ) { }

  ngOnInit(): void {
    this.loadPools();
  }

  onSubmit(): void {
    this.dockerStore.setDockerPool(this.form.value.pool).pipe(
      untilDestroyed(this),
    ).subscribe(() => {
      this.snackbar.success(
        this.translate.instant('Using pool {name}', { name: this.form.value.pool }),
      );
      this.dialogRef.close(true);
    });
  }

  private loadPools(): void {
    forkJoin([
      this.dockerStore.selectedPool$.pipe(take(1)),
      this.appService.getPoolList(),
    ])
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
        error: (error: unknown) => {
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
