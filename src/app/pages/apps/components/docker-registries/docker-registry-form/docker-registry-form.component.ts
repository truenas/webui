import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { dockerHubRegistry, DockerRegistry, DockerRegistryPayload } from 'app/interfaces/docker-registry.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { UrlValidationService } from 'app/modules/forms/ix-forms/validators/url-validation.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-docker-registry-form',
  templateUrl: './docker-registry-form.component.html',
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
    IxSelectComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TestDirective,
  ],
})
export class DockerRegistryFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.AppsWrite];

  protected existingDockerRegistry: DockerRegistry | undefined;
  protected isLoggedInToDockerHub = false;
  protected isFormLoading = false;
  protected readonly dockerHubRegistry = dockerHubRegistry;

  protected registriesOptions$ = of([
    { label: this.translate.instant('Docker Hub'), value: dockerHubRegistry },
    { label: this.translate.instant('Other Registry'), value: '' },
  ]);

  form = this.fb.group({
    registry: [dockerHubRegistry],
    name: ['', Validators.required],
    username: ['', Validators.required],
    password: ['', Validators.required],
    uri: ['', {
      validators: Validators.pattern(this.urlValidationService.urlRegex),
      updateOn: 'blur',
    }],
  });

  get title(): string {
    return this.existingDockerRegistry
      ? this.translate.instant('Edit Docker Registry')
      : this.translate.instant('Create Docker Registry');
  }

  constructor(
    private api: ApiService,
    public slideInRef: SlideInRef<{ isLoggedInToDockerHub?: boolean; registry?: DockerRegistry } | undefined, boolean>,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private fb: FormBuilder,
    private urlValidationService: UrlValidationService,
    private translate: TranslateService,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });

    this.existingDockerRegistry = this.slideInRef.getData()?.registry;
    this.isLoggedInToDockerHub = this.slideInRef.getData()?.isLoggedInToDockerHub;

    if (!this.isLoggedInToDockerHub && !this.existingDockerRegistry) {
      this.setNameForDockerHub();
    }
  }

  ngOnInit(): void {
    if (this.existingDockerRegistry) {
      this.setRegistryForEdit();
    }

    this.form.controls.registry.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      this.form.patchValue({ uri: value });

      if (value === dockerHubRegistry) {
        this.setNameForDockerHub();
      } else {
        this.form.controls.name.patchValue('');
      }
    });
  }

  onSubmit(): void {
    const payload = this.getPayload();

    let request$: Observable<DockerRegistryPayload>;

    if (this.existingDockerRegistry) {
      request$ = this.api.call('app.registry.update', [this.existingDockerRegistry.id, payload]);
    } else {
      request$ = this.api.call('app.registry.create', [payload]);
    }

    this.isFormLoading = true;

    request$.pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.slideInRef.close({ response: true, error: null });
        },
        error: (error: unknown) => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
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
