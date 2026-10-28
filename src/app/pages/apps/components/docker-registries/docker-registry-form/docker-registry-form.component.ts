import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType,
  TnFormFieldComponent, TnFormSectionComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { dockerHubRegistry, DockerRegistry, DockerRegistryPayload } from 'app/interfaces/docker-registry.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { UrlValidationService } from 'app/modules/forms/ix-forms/validators/url-validation.service';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-docker-registry-form',
  templateUrl: './docker-registry-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TranslateModule,
    IxFormComponent,
    TnFormFieldComponent,
    TnFormSectionComponent,
    TnInputComponent,
    TnSelectComponent,
  ],
})
export class DockerRegistryFormComponent extends IxFormHostForm implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private urlValidationService = inject(UrlValidationService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  /** Provided by the `<tn-side-panel>` host. */
  readonly registry = input<DockerRegistry | undefined>(undefined);
  readonly isLoggedInToDockerHub = input(false);

  readonly requiredRoles = [Role.AppsWrite];
  protected readonly InputType = InputType;

  protected existingDockerRegistry: DockerRegistry | undefined;
  /** Resolved from the input; read by the template. */
  protected loggedInToDockerHub = false;
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

  ngOnInit(): void {
    this.existingDockerRegistry = this.registry();
    this.loggedInToDockerHub = this.isLoggedInToDockerHub();

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

  protected handleSubmit = (event: FormSubmitEvent): SubmitResult => {
    const payload = this.getPayload();
    const existingDockerRegistry = this.existingDockerRegistry;

    return {
      request$: existingDockerRegistry
        ? this.api.call('app.registry.update', [existingDockerRegistry.id, payload])
        : this.api.call('app.registry.create', [payload]),
      successMessage: event.isEdit
        ? this.translate.instant('Registry updated.')
        : this.translate.instant('Registry added.'),
    };
  };

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
