import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { nameValidatorRegex } from 'app/constants/name-validator.constant';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import { BootenvCloneParams } from 'app/interfaces/boot-environment.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-bootenv-form',
  templateUrl: './bootenv-form.component.html',
  styleUrls: ['./bootenv-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class BootEnvironmentFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];
  protected currentName = signal(inject<string>(SLIDE_IN_DATA));
  protected formGroup = this.formBuilder.group({
    source: [this.currentName(), [Validators.required]],
    target: ['', [Validators.required, Validators.pattern(nameValidatorRegex)]],
  });

  protected isLoading = signal(false);
  protected tooltips = {
    name: helptextSystemBootenv.clone_name_tooltip,
    source: helptextSystemBootenv.clone_source_tooltip,
  };

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    private errorHandler: FormErrorHandlerService,
    private slideInRef: SlideInRef<BootEnvironmentFormComponent>,
  ) {}

  ngOnInit(): void {
    this.formGroup.controls.source.disable();
  }

  onSubmit(): void {
    this.isLoading.set(true);
    const cloneParams: BootenvCloneParams = [{
      id: this.currentName(),
      target: this.formGroup.value.target,
    }];

    this.api.call('boot.environment.clone', cloneParams).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.slideInRef.close(true);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.formGroup);
      },
    });
  }
}
