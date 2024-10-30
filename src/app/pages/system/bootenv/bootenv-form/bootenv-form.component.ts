import {
  ChangeDetectionStrategy,
  Component,
  ChangeDetectorRef,
  OnInit,
  Inject,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { nameValidatorRegex } from 'app/constants/name-validator.constant';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { BootEnvironmentAction } from 'app/enums/boot-environment-action.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import {
  BootenvTooltip,
  CreateBootenvParams,
  UpdateBootenvParams,
} from 'app/interfaces/bootenv.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WebSocketService } from 'app/services/ws.service';

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

  Operations = BootEnvironmentAction;
  currentName?: string;
  operation: BootEnvironmentAction;
  title: string;

  formGroup = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(nameValidatorRegex)]],
  });

  isFormLoading = false;

  tooltips: BootenvTooltip = {
    name: helptextSystemBootenv.create_name_tooltip,
  };

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private changeDetectorRef: ChangeDetectorRef,
    private slideInRef: SlideInRef<BootEnvironmentFormComponent>,
    @Inject(SLIDE_IN_DATA) private slideInData: { operation: BootEnvironmentAction; name?: string },
  ) {}

  ngOnInit(): void {
    if (this.slideInData) {
      this.currentName = this.slideInData.name;
      this.operation = this.slideInData.operation;
      this.setupForm();
    }
  }

  setupForm(): void {
    switch (this.operation) {
      case this.Operations.Rename:
        this.title = this.translate.instant('Rename Boot Environment');
        this.formGroup.patchValue({
          name: this.currentName,
        });

        this.tooltips = {
          name: helptextSystemBootenv.create_name_tooltip,
        };
        break;
      case this.Operations.Clone:
        this.title = this.translate.instant('Clone Boot Environment');

        this.formGroup.addControl(
          'source',
          new FormControl({ value: this.currentName, disabled: true }, Validators.required),
        );

        this.tooltips = {
          name: helptextSystemBootenv.clone_name_tooltip,
          source: helptextSystemBootenv.clone_source_tooltip,
        };
        break;
      default:
        this.title = this.translate.instant('Create Boot Environment');
        this.tooltips = {
          name: helptextSystemBootenv.create_name_tooltip,
        };
        break;
    }

    this.changeDetectorRef.detectChanges();
  }

  onSubmit(): void {
    this.isFormLoading = true;
    switch (this.operation) {
      case this.Operations.Create:
        this.createEnvironment();
        break;
      case this.Operations.Rename:
        this.renameEnvironment();
        break;
      case this.Operations.Clone:
        this.cloneEnvironment();
        break;
      default:
        console.error('Unsupported operation');
    }
  }

  private createEnvironment(): void {
    const createParams: CreateBootenvParams = [{
      name: this.formGroup.value.name,
    }];

    this.ws.call('bootenv.create', createParams).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.slideInRef.close(true);
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.slideInRef.close(false);
        this.errorHandler.handleWsFormError(error, this.formGroup);
      },
    });
  }

  private renameEnvironment(): void {
    const renameParams: UpdateBootenvParams = [
      this.currentName,
      {
        name: this.formGroup.value.name,
      },
    ];

    this.ws.call('bootenv.update', renameParams).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.slideInRef.close(true);
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.slideInRef.close(false);
        this.errorHandler.handleWsFormError(error, this.formGroup);
      },
    });
  }

  private cloneEnvironment(): void {
    const cloneParams: CreateBootenvParams = [{
      name: this.formGroup.value.name,
      source: this.currentName,
    }];

    this.ws.call('bootenv.create', cloneParams).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.slideInRef.close(true);
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.slideInRef.close(false);
        this.errorHandler.handleWsFormError(error, this.formGroup);
      },
    });
  }
}
