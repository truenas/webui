import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';
import { Role } from 'app/enums/role.enum';
import { AppCreate } from 'app/interfaces/app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-custom-app-form',
  templateUrl: './custom-app-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomAppFormComponent {
  protected requiredRoles = [Role.AppsWrite];
  protected readonly CodeEditorLanguage = CodeEditorLanguage;
  form = this.fb.group({
    release_name: ['', Validators.required],
    custom_compose_config_string: ['', Validators.required],
  });
  isLoading = false;
  protected tooltip = this.translate.instant('Add custom app config in Yaml format.');
  constructor(
    private fb: FormBuilder,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private dialogRef: IxSlideInRef<CustomAppFormComponent>,
  ) {}

  onSubmit(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    const data = this.form.value;
    this.dialogService.jobDialog(
      this.ws.job(
        'app.create',
        [{
          custom_app: true,
          app_name: data.release_name,
          custom_compose_config_string: data.custom_compose_config_string,
        } as AppCreate],
      ),
      {
        title: this.translate.instant('Custom App'),
        canMinimize: false,
        description: this.translate.instant('Creating custom app'),
      },
    ).afterClosed().pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.dialogRef.close();
      },
      error: (error) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.errorHandler.showErrorModal(error);
      },
    });
  }
}
