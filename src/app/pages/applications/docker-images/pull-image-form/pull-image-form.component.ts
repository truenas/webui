import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { latestVersion } from 'app/constants/catalog.constants';
import helptext from 'app/helptext/apps/apps';
import { PullContainerImageParams } from 'app/interfaces/container-image.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

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
    from_image: helptext.pullImageForm.imageName.tooltip,
    tag: helptext.pullImageForm.imageTags.tooltip,
    username: helptext.pullImageForm.username.tooltip,
    password: helptext.pullImageForm.password.tooltip,
  };

  constructor(
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
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
      params.docker_authentication = {
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
      this.slideInService.close();
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
      this.isFormLoading = false;
      dialogRef.close();
      new EntityUtils().handleWsError(this, error, this.dialogService);
      this.cdr.markForCheck();
    });
  }
}
