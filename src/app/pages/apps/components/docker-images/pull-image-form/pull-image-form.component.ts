import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { latestVersion } from 'app/constants/catalog.constants';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { PullContainerImageParams } from 'app/interfaces/container-image.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-pull-image-form',
  templateUrl: './pull-image-form.component.html',
  styleUrls: ['./pull-image-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    MatButton,
    IxFieldsetComponent,
    IxInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TestDirective,
  ],
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
    private slideInRef: SlideInRef<PullImageFormComponent>,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private fb: FormBuilder,
    private translate: TranslateService,
    private dialogService: DialogService,
  ) {}

  onSubmit(): void {
    const values = this.form.value;

    const params: PullContainerImageParams = {
      image: values.image,
    };

    if (values.tag) {
      params.image += ':' + values.tag;
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
