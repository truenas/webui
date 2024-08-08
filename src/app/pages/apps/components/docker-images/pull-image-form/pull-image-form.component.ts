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
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-pull-image-form',
  templateUrl: './pull-image-form.component.html',
  styleUrls: ['./pull-image-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PullImageFormComponent {
  protected readonly requiredRoles = [Role.AppsWrite];

  isFormLoading = false;

  form = this.fb.group({
    image: ['', Validators.required],
    tag: [latestVersion],
    username: [''],
    password: [''],
  });

  readonly tooltips = {
    image: helptextApps.pullImageForm.imageName.tooltip,
    tag: helptextApps.pullImageForm.imageTags.tooltip,
    username: helptextApps.pullImageForm.username.tooltip,
    password: helptextApps.pullImageForm.password.tooltip,
  };

  constructor(
    private ws: WebSocketService,
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
      image: values.image,
    };

    if (values.tag) {
      params.image += ':v' + values.tag;
    }
    if (values.username || values.password) {
      params.auth_config = {
        username: values.username,
        password: values.password,
      };
    }

    this.isFormLoading = true;
    this.dialogService.jobDialog(
      this.ws.job('app.image.pull', [params]),
      { title: this.translate.instant('Pulling...') },
    )
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.slideInRef.close(true);
        },
        error: (error) => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.errorHandler.showErrorModal(error);
        },
      });
  }
}
