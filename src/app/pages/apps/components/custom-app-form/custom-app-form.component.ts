import {
  ChangeDetectionStrategy, Component, inject, input, OnInit,
} from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { filter, map } from 'rxjs';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';
import { Role } from 'app/enums/role.enum';
import { jsonToYaml } from 'app/helpers/json-to-yaml.helper';
import { App, AppCreate } from 'app/interfaces/app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCodeEditorComponent } from 'app/modules/forms/ix-forms/components/ix-code-editor/ix-code-editor.component';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { forbiddenAsyncValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { ApiService } from 'app/modules/websocket/api.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';

// Built here rather than inline in the component, and left with an inferred return type — see
// the `V` type parameter on IxFormHostForm for why.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createCustomAppForm(formBuilder: FormBuilder) {
  return formBuilder.group({
    release_name: ['', Validators.required],
    custom_compose_config_string: ['\n\n', Validators.required],
  });
}

type CustomAppFormValue = ReturnType<ReturnType<typeof createCustomAppForm>['getRawValue']>;

@Component({
  selector: 'ix-custom-app-form',
  templateUrl: './custom-app-form.component.html',
  styleUrls: ['./custom-app-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFormComponent,
    ReactiveFormsModule,
    TranslateModule,
    TnFormFieldComponent,
    TnFormSectionComponent,
    TnInputComponent,
    IxCodeEditorComponent,
  ],
})
export class CustomAppFormComponent extends IxFormHostForm<boolean, CustomAppFormValue> implements OnInit {
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private appService = inject(ApplicationsService);
  private router = inject(Router);

  /** Provided by the `<tn-side-panel>` host in edit mode. */
  readonly app = input<App | undefined>(undefined);

  readonly requiredRoles = [Role.AppsWrite];
  protected readonly CodeEditorLanguage = CodeEditorLanguage;
  protected readonly form = createCustomAppForm(this.fb);

  protected get isNew(): boolean {
    return !this.existingApp;
  }

  protected existingApp: App | undefined;

  protected forbiddenAppNames$ = this.appService.getAllApps().pipe(map((apps) => apps.map((app) => app.name)));

  ngOnInit(): void {
    this.existingApp = this.app();

    if (this.existingApp?.id) {
      this.loadExistingApp(this.existingApp.id);
    }

    if (!this.existingApp) {
      this.addForbiddenAppNamesValidator();
    }
  }

  /**
   * The custom app's YAML config isn't on the app record the opener passes in, so edit mode
   * re-reads the app before patching. Routed through `loadFormConfig` so the panel shows its
   * loader, Save stays disabled until the real config is on screen, and a failed read offers a
   * retry instead of silently saving the empty defaults.
   */
  private loadExistingApp(appId: string): void {
    this.loadFormConfig(
      this.appService.getApp(appId).pipe(filter((apps) => apps.length > 0)),
      ([app]) => {
        this.existingApp = app;
        this.form.patchValue({
          release_name: app.id,
          custom_compose_config_string: jsonToYaml(app.config),
        });
      },
    );
  }

  private addForbiddenAppNamesValidator(): void {
    this.form.controls.release_name.setAsyncValidators(forbiddenAsyncValues(this.forbiddenAppNames$));
    this.form.controls.release_name.updateValueAndValidity();
  }

  /**
   * Both paths run behind the job dialog, which reports progress and the outcome itself and is
   * followed by a navigation to the app — hence `suppressSuccessSnackbar` and a null message.
   */
  protected handleSubmit = ({ allValues }: FormSubmitEvent<CustomAppFormValue>): SubmitResult => {
    const job$ = this.isNew
      ? this.api.job(
          'app.create',
          [{
            custom_app: true,
            app_name: allValues.release_name,
            custom_compose_config_string: allValues.custom_compose_config_string,
          } as AppCreate],
        )
      : this.api.job('app.update', [
          allValues.release_name,
          { custom_compose_config_string: allValues.custom_compose_config_string },
        ]);

    return {
      request$: this.dialogService.jobDialog(job$, {
        title: this.translate.instant('Custom App'),
        canMinimize: false,
        description: this.isNew
          ? this.translate.instant('Creating custom app')
          : this.translate.instant('Updating custom app'),
      }).afterClosed(),
      successMessage: null,
      onSuccess: () => this.navigateToApp(),
    };
  };

  private navigateToApp(): void {
    if (this.existingApp) {
      this.router.navigate(['/apps', 'installed', this.existingApp.metadata.train, this.existingApp.name]);
    } else {
      this.router.navigate(['/apps', 'installed']);
    }
  }
}
