import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType,
  TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { latestVersion } from 'app/constants/catalog.constants';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { PullContainerImageParams } from 'app/interfaces/container-image.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
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
    TnFormFieldComponent,
    TnFormSectionComponent,
    TnInputComponent,
  ],
})
export class PullImageFormComponent extends SidePanelForm {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private fb = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private dialogService = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  readonly requiredRoles = [Role.AppsWrite];
  protected readonly InputType = InputType;

  readonly isFormLoading = signal(false);

  protected readonly form = this.fb.group({
    image: ['', Validators.required],
    tag: [latestVersion],
    username: [''],
    password: [''],
  });

  /** Public signal hosts can read to disable a Save action while invalid or loading. */
  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  readonly tooltips = {
    image: helptextApps.pullImageForm.imageName.tooltip,
  };

  protected onSubmit(): void {
    if (!this.canSubmit()) {
      return;
    }

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
          this.close(true);
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }
}
