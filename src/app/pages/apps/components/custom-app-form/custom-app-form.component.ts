import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { forbiddenAsyncValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-custom-app-form',
  templateUrl: './custom-app-form.component.html',
  styleUrls: ['./custom-app-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    TnFormFieldComponent,
    TnFormSectionComponent,
    TnInputComponent,
    IxCodeEditorComponent,
  ],
})
export class CustomAppFormComponent extends SidePanelForm implements OnInit {
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private dialogService = inject(DialogService);
  private appService = inject(ApplicationsService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  /** Provided by the `<tn-side-panel>` host in edit mode. */
  readonly app = input<App | undefined>(undefined);

  readonly requiredRoles = [Role.AppsWrite];
  protected readonly CodeEditorLanguage = CodeEditorLanguage;
  protected readonly form = this.fb.group({
    release_name: ['', Validators.required],
    custom_compose_config_string: ['\n\n', Validators.required],
  });

  protected get isNew(): boolean {
    return !this.existingApp;
  }

  protected existingApp: App | undefined;

  readonly isLoading = signal(false);

  /** Public signal hosts can read to disable a Save action while invalid or loading. */
  readonly canSubmit = this.trackCanSubmit(this.isLoading);

  protected forbiddenAppNames$ = this.appService.getAllApps().pipe(map((apps) => apps.map((app) => app.name)));

  ngOnInit(): void {
    this.existingApp = this.app();

    if (this.existingApp?.id) {
      this.handleExistingApp(this.existingApp);
    }

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

  private addForbiddenAppNamesValidator(): void {
    this.form.controls.release_name.setAsyncValidators(forbiddenAsyncValues(this.forbiddenAppNames$));
    this.form.controls.release_name.updateValueAndValidity();
  }

  protected onSubmit(): void {
    if (!this.canSubmit()) {
      return;
    }

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
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.close(true);
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

  private handleExistingApp(existingApp: App): void {
    this.isLoading.set(true);

    this.appService.getApp(existingApp.id).pipe(
      filter((apps) => apps.length > 0),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ([app]) => {
        this.existingApp = app;
        this.setAppForEdit(app);
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        this.close(false);
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }
}
