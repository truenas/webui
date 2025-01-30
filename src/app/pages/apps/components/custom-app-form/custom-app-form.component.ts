import {
  ChangeDetectionStrategy, Component,
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
import { filter, map, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';
import { Role } from 'app/enums/role.enum';
import { jsonToYaml } from 'app/helpers/json-to-yaml.helper';
import { App, AppCreate } from 'app/interfaces/app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCodeEditorComponent } from 'app/modules/forms/ix-forms/components/ix-code-editor/ix-code-editor.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { forbiddenAsyncValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-custom-app-form',
  templateUrl: './custom-app-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    ModalHeaderComponent,
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
  protected requiredRoles = [Role.AppsWrite];
  protected readonly CodeEditorLanguage = CodeEditorLanguage;
  protected form = this.fb.group({
    release_name: ['', Validators.required],
    custom_compose_config_string: ['\n\n', Validators.required],
  });

  get isNew(): boolean {
    return !this.existingApp;
  }

  protected existingApp: App | undefined;

  protected isLoading = signal(false);
  protected forbiddenAppNames$ = this.appService.getAllApps().pipe(map((apps) => apps.map((app) => app.name)));

  constructor(
    private fb: FormBuilder,
    private translate: TranslateService,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private appService: ApplicationsService,
    public slideInRef: SlideInRef<App | undefined, boolean>,
    private router: Router,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });

    this.existingApp = this.slideInRef.getData();

    if (this.existingApp?.id) {
      this.handleExistingApp();
    }
  }

  ngOnInit(): void {
    if (!this.existingApp) {
      this.setNewApp();
    }
  }

  private setNewApp(): void {
    this.addForbiddenAppNamesValidator();
  }

  private setAppForEdit(app: App): void {
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

    const appCreate$ = this.api.job(
      'app.create',
      [{
        custom_app: true,
        app_name: data.release_name,
        custom_compose_config_string: data.custom_compose_config_string,
      } as AppCreate],
    );

    const appUpdate$ = this.api.job('app.update', [
      data.release_name,
      { custom_compose_config_string: data.custom_compose_config_string },
    ]);

    const job$ = this.isNew ? appCreate$ : appUpdate$;

    this.dialogService.jobDialog(
      job$,
      {
        title: this.translate.instant('Custom App'),
        canMinimize: false,
        description: this.isNew
          ? this.translate.instant('Creating custom app')
          : this.translate.instant('Updating custom app'),
      },
    ).afterClosed().pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.slideInRef.close({ response: true, error: null });
        if (this.existingApp) {
          this.router.navigate(['/apps', 'installed', this.existingApp.metadata.train, this.existingApp.name]);
        } else {
          this.router.navigate(['/apps', 'installed']);
        }
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  private handleExistingApp(): void {
    this.isLoading.set(true);

    this.appService.getApp(this.existingApp.id).pipe(
      filter((apps) => apps.length > 0),
      untilDestroyed(this),
    ).subscribe({
      next: ([app]) => {
        this.existingApp = app;
        this.setAppForEdit(app);
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        this.slideInRef.close({ response: false, error });
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }
}
