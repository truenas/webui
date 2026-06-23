import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType,
  TnButtonComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { dockerHubRegistry, DockerRegistry, DockerRegistryPayload } from 'app/interfaces/docker-registry.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { UrlValidationService } from 'app/modules/forms/ix-forms/validators/url-validation.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-docker-registry-form',
  templateUrl: './docker-registry-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TranslateModule,
    ModalHeaderComponent,
    TnButtonComponent,
    TnFormFieldComponent,
    TnFormSectionComponent,
    TnInputComponent,
    TnSelectComponent,
    FormActionsComponent,
    RequiresRolesDirective,
  ],
})
export class DockerRegistryFormComponent extends SidePanelForm implements OnInit {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private fb = inject(FormBuilder);
  private urlValidationService = inject(UrlValidationService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  /** Provided by a `<tn-side-panel>` host; the legacy SlideIn host passes these via `getData()`. */
  readonly registry = input<DockerRegistry | undefined>(undefined);
  readonly isLoggedInToDockerHub = input(false);

  readonly requiredRoles = [Role.AppsWrite];
  protected readonly InputType = InputType;

  protected existingDockerRegistry: DockerRegistry | undefined;
  /** Resolved from the input (panel host) or `getData()` (legacy host); read by the template. */
  protected loggedInToDockerHub = false;
  readonly isFormLoading = signal(false);
  protected readonly dockerHubRegistry = ignoreTranslation(dockerHubRegistry);

  protected registriesOptions$ = of([
    { label: this.translate.instant('Docker Hub'), value: dockerHubRegistry },
    { label: this.translate.instant('Other Registry'), value: '' },
  ]);

  protected readonly form = this.fb.group({
    registry: [dockerHubRegistry],
    name: ['', Validators.required],
    username: ['', Validators.required],
    password: ['', Validators.required],
    uri: ['', {
      validators: Validators.pattern(this.urlValidationService.urlRegex),
      updateOn: 'blur',
    }],
  });

  /** Public signal hosts can read to disable a Save action while invalid or loading. */
  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  get title(): string {
    return this.existingDockerRegistry
      ? this.translate.instant('Edit Docker Registry')
      : this.translate.instant('Create Docker Registry');
  }

  ngOnInit(): void {
    // Legacy SlideIn host passes data via getData(); a tn-side-panel host passes it via inputs.
    const data = this.slideInRef?.getData() as {
      isLoggedInToDockerHub?: boolean;
      registry?: DockerRegistry;
    } | undefined;
    this.existingDockerRegistry = this.slideInRef ? data?.registry : this.registry();
    this.loggedInToDockerHub = this.slideInRef
      ? Boolean(data?.isLoggedInToDockerHub)
      : this.isLoggedInToDockerHub();

    if (!this.loggedInToDockerHub && !this.existingDockerRegistry) {
      this.setNameForDockerHub();
    }

    if (this.existingDockerRegistry) {
      this.setRegistryForEdit();
    }

    this.form.controls.registry.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.form.patchValue({ uri: value });

      if (value === dockerHubRegistry) {
        this.setNameForDockerHub();
      } else {
        this.form.controls.name.patchValue('');
      }
    });
  }

  onSubmit(): void {
    if (!this.canSubmit()) {
      return;
    }

    const payload = this.getPayload();

    let request$: Observable<DockerRegistryPayload>;

    if (this.existingDockerRegistry) {
      request$ = this.api.call('app.registry.update', [this.existingDockerRegistry.id, payload]);
    } else {
      request$ = this.api.call('app.registry.create', [payload]);
    }

    this.isFormLoading.set(true);

    request$.pipe(takeUntilDestroyed(this.destroyRef))
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

  private getPayload(): DockerRegistryPayload {
    const payload = {
      ...this.form.value,
      uri: this.form.value.uri || dockerHubRegistry,
    };

    delete payload.registry;

    return payload as DockerRegistryPayload;
  }

  private setRegistryForEdit(): void {
    this.form.patchValue({
      ...this.existingDockerRegistry,
    });
  }

  private setNameForDockerHub(): void {
    this.form.controls.name.patchValue(this.translate.instant('Docker Hub'));
  }
}
