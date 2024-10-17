import {
  ChangeDetectionStrategy, Component,
  Inject,
  OnInit,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';
import { Role } from 'app/enums/role.enum';
import { jsonToYaml } from 'app/helpers/json-to-yaml.helper';
import { App, AppCreate } from 'app/interfaces/app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCodeEditorComponent } from 'app/modules/forms/ix-forms/components/ix-code-editor/ix-code-editor.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxModalHeaderComponent } from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-modal-header/ix-modal-header.component';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { forbiddenAsyncValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-custom-app-form',
  templateUrl: './custom-app-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    IxModalHeaderComponent,
    MatCard,
    MatCardContent,
    IxInputComponent,
    IxCodeEditorComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
  ],
})
export class CustomAppFormComponent implements OnInit {
  protected isNew = signal(true);
  protected requiredRoles = [Role.AppsWrite];
  protected readonly CodeEditorLanguage = CodeEditorLanguage;
  protected form = this.fb.group({
    release_name: ['', Validators.required],
    custom_compose_config_string: ['\n\n', Validators.required],
  });
  protected isLoading = signal(false);
  protected forbiddenAppNames$ = this.appService.getAllApps().pipe(map((apps) => apps.map((app) => app.name)));

  constructor(
    private fb: FormBuilder,
    private translate: TranslateService,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private appService: ApplicationsService,
    private dialogRef: IxSlideInRef<CustomAppFormComponent>,
    private router: Router,
    @Inject(SLIDE_IN_DATA) public data: App,
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.setAppForEdit(this.data);
    } else {
      this.setNewApp();
    }
  }

  private setNewApp(): void {
    this.addForbiddenAppNamesValidator();
  }

  private setAppForEdit(app: App): void {
    this.isNew.set(false);
    this.form.patchValue({
      release_name: app.id,
      custom_compose_config_string: jsonToYaml(app.config),
    });
  }

  protected addForbiddenAppNamesValidator(): void {
    this.form.controls.release_name.setAsyncValidators(forbiddenAsyncValues(this.forbiddenAppNames$));
    this.form.controls.release_name.updateValueAndValidity();
  }

  protected onSubmit(): void {
    this.isLoading.set(true);
    const data = this.form.value;

    const appCreate$ = this.ws.job(
      'app.create',
      [{
        custom_app: true,
        app_name: data.release_name,
        custom_compose_config_string: data.custom_compose_config_string,
      } as AppCreate],
    );

    const appUpdate$ = this.ws.job('app.update', [
      data.release_name,
      { custom_compose_config_string: data.custom_compose_config_string },
    ]);

    const job$ = this.isNew() ? appCreate$ : appUpdate$;

    this.dialogService.jobDialog(
      job$,
      {
        title: this.translate.instant('Custom App'),
        canMinimize: false,
        description: this.isNew()
          ? this.translate.instant('Creating custom app')
          : this.translate.instant('Updating custom app'),
      },
    ).afterClosed().pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.dialogRef.close();
        if (this.isNew()) {
          this.router.navigate(['/apps', 'installed']);
        } else {
          this.router.navigate(['/apps', 'installed', this.data.metadata.train, this.data.name]);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }
}
