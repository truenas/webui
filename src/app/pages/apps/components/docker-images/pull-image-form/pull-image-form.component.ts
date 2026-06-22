import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType,
  TnButtonComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { latestVersion } from 'app/constants/catalog.constants';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { PullContainerImageParams } from 'app/interfaces/container-image.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-pull-image-form',
  templateUrl: './pull-image-form.component.html',
  styleUrls: ['./pull-image-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    ModalHeaderComponent,
    TnButtonComponent,
    TnFormFieldComponent,
    TnFormSectionComponent,
    TnInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
  ],
})
export class PullImageFormComponent {
  private api = inject(ApiService);
  slideInRef = inject<SlideInRef<undefined, boolean>>(SlideInRef);
  private errorHandler = inject(ErrorHandlerService);
  private fb = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private dialogService = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.AppsWrite];
  protected readonly InputType = InputType;

  protected isFormLoading = signal(false);

  form = this.fb.group({
    image: ['', Validators.required],
    tag: [latestVersion],
    username: [''],
    password: [''],
  });

  readonly tooltips = {
    image: helptextApps.pullImageForm.imageName.tooltip,
  };

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  protected onSubmit(): void {
    const values = this.form.getRawValue();

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

    this.isFormLoading.set(true);
    this.dialogService.jobDialog(
      this.api.job('app.image.pull', [params]),
      { title: this.translate.instant('Pulling...') },
    )
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isFormLoading.set(false);
          this.slideInRef.close({ response: true });
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }
}
