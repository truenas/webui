import {
  ChangeDetectionStrategy,
  Component,
  ChangeDetectorRef,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { BootEnvironmentAction } from 'app/enums/boot-environment-action.enum';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import {
  BootenvTooltip,
  CreateBootenvParams,
  UpdateBootenvParams,
} from 'app/interfaces/bootenv.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { NameValidationService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './bootenv-form.component.html',
  styleUrls: ['./bootenv-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootEnvironmentFormComponent {
  Operations = BootEnvironmentAction;
  operation: BootEnvironmentAction = BootEnvironmentAction.Create;
  currentName?: string;
  title: string;

  formGroup = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(this.nameValidationService.nameRegex)]],
  });

  isFormLoading = false;

  tooltips: BootenvTooltip = {
    name: helptextSystemBootenv.create_name_tooltip,
  };

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private nameValidationService: NameValidationService,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  setupForm(operation: BootEnvironmentAction, name?: string): void {
    this.operation = operation;

    switch (this.operation) {
      case this.Operations.Rename:
        this.title = this.translate.instant('Rename Boot Environment');
        this.currentName = name;
        this.formGroup.patchValue({
          name,
        });

        this.tooltips = {
          name: helptextSystemBootenv.create_name_tooltip,
        };
        break;
      case this.Operations.Clone:
        this.title = this.translate.instant('Clone Boot Environment');
        this.currentName = name;

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
      case this.Operations.Create: {
        const createParams: CreateBootenvParams = [{
          name: this.formGroup.value.name,
        }];

        this.ws.call('bootenv.create', createParams).pipe(untilDestroyed(this)).subscribe({
          next: () => {
            this.isFormLoading = false;
            this.slideInService.close(null, true);
          },
          error: (error) => {
            this.isFormLoading = false;
            this.slideInService.close(error, false);
            this.errorHandler.handleWsFormError(error, this.formGroup);
          },
        });

        break;
      }
      case this.Operations.Rename: {
        const renameParams: UpdateBootenvParams = [
          this.currentName,
          {
            name: this.formGroup.value.name,
          },
        ];

        this.ws.call('bootenv.update', renameParams).pipe(untilDestroyed(this)).subscribe({
          next: () => {
            this.isFormLoading = false;
            this.slideInService.close(null, true);
          },
          error: (error) => {
            this.isFormLoading = false;
            this.slideInService.close(error, false);
            this.errorHandler.handleWsFormError(error, this.formGroup);
          },
        });

        break;
      }
      case this.Operations.Clone: {
        const cloneParams: CreateBootenvParams = [{
          name: this.formGroup.value.name,
          source: this.currentName,
        }];

        this.ws.call('bootenv.create', cloneParams).pipe(untilDestroyed(this)).subscribe({
          next: () => {
            this.isFormLoading = false;
            this.slideInService.close(null, true);
          },
          error: (error) => {
            this.isFormLoading = false;
            this.slideInService.close(error, false);
            this.errorHandler.handleWsFormError(error, this.formGroup);
          },
        });

        break;
      }
    }
  }
}
