import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { latestVersion } from 'app/constants/catalog.constants';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { PullContainerImageParams } from 'app/interfaces/container-image.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  templateUrl: './pull-image-form.component.html',
  styleUrls: ['./pull-image-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PullImageFormComponent {
  isFormLoading = false;

  form = this.fb.group({
    from_image: ['', Validators.required],
    tag: [latestVersion],
    username: [''],
    password: [''],
  });

  readonly tooltips = {
    from_image: helptextApps.pullImageForm.imageName.tooltip,
    tag: helptextApps.pullImageForm.imageTags.tooltip,
    username: helptextApps.pullImageForm.username.tooltip,
    password: helptextApps.pullImageForm.password.tooltip,
  };

  protected readonly requiredRoles = [Role.AppsWrite];

  constructor(
    private slideInRef: IxSlideInRef<PullImageFormComponent>,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private fb: FormBuilder,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private dialogService: DialogService,
  ) {}

  onSubmit(): void {
    const values = this.form.value;

    const params: PullContainerImageParams = {
      from_image: values.from_image,
    };

    if (values.tag) {
      params.tag = values.tag;
    }
    if (values.username || values.password) {
      params.authentication = {
        username: values.username,
        password: values.password,
      };
    }

    this.isFormLoading = true;
    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: {
        title: this.translate.instant('Pulling...'),
      },
      disableClose: true,
    });
    dialogRef.componentInstance.setCall('container.image.pull', [params]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = false;
      this.cdr.markForCheck();
      dialogRef.close();
      this.slideInRef.close();
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
      this.isFormLoading = false;
      dialogRef.close();
      this.dialogService.error(this.errorHandler.parseError(error));
      this.cdr.markForCheck();
    });
  }
}
