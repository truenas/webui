import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { BootEnvironmentActions } from 'app/enums/bootenv-actions.enum';
import { helptext_system_bootenv } from 'app/helptext/system/boot-env';
import { ApiDirectory } from 'app/interfaces/api-directory.interface';
import { BootenvTooltip } from 'app/interfaces/bootenv.interface';
import { regexValidator } from 'app/pages/common/entity/entity-form/validators/regex-validation';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { BootEnvService, WebSocketService } from 'app/services';
import { IxModalService } from 'app/services/ix-modal.service';

@UntilDestroy()
@Component({
  selector: 'app-bootenv-form',
  templateUrl: './bootenv-form.component.html',
  styleUrls: ['./bootenv-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootEnvironmentFormComponent {
  Operations = BootEnvironmentActions;
  operation: BootEnvironmentActions = BootEnvironmentActions.Create;
  currentName?: string;

  formGroup: FormGroup = this.formBuilder.group({
    name: ['', [Validators.required, regexValidator(this.bootEnvService.bootenv_name_regex)]],
  });

  isFormLoading = false;

  tooltips: BootenvTooltip = {
    name: helptext_system_bootenv.create_name_tooltip,
  };

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private bootEnvService: BootEnvService,
    private modalService: IxModalService,
  ) {}

  setupForm(operation: BootEnvironmentActions, name?: string): FormGroup {
    this.operation = operation;

    switch (this.operation) {
      case this.Operations.Rename:
        this.currentName = name;
        this.formGroup.patchValue({
          name,
        });

        this.tooltips = {
          name: helptext_system_bootenv.create_name_tooltip,
        };
        break;
      case this.Operations.Clone:
        this.currentName = name;

        this.formGroup.addControl(
          'source',
          new FormControl({ value: this.currentName, disabled: true }, Validators.required),
        );

        this.tooltips = {
          name: helptext_system_bootenv.clone_name_tooltip,
          source: helptext_system_bootenv.clone_source_tooltip,
        };
        break;
      default:
        this.tooltips = {
          name: helptext_system_bootenv.create_name_tooltip,
        };
        break;
    }

    return this.formGroup;
  }

  onSubmit(): void {
    let apiMethod;
    let apiParams: unknown;

    switch (this.operation) {
      case this.Operations.Create:
        apiMethod = 'bootenv.create' as keyof ApiDirectory;
        apiParams = [{
          name: this.formGroup.value.name,
        }];
        break;
      case this.Operations.Rename:
        apiMethod = 'bootenv.update' as keyof ApiDirectory;
        apiParams = [
          this.currentName,
          {
            name: this.formGroup.value.name,
          },
        ];
        break;
      case this.Operations.Clone:
        // Cloning is done via adding source param to create API method
        apiMethod = 'bootenv.create' as keyof ApiDirectory;
        apiParams = [
          {
            name: this.formGroup.value.name,
            source: this.formGroup.value.source,
          },
        ];
        break;
    }

    const query$: Observable<unknown> = this.ws.call(apiMethod, apiParams);

    query$.pipe(untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = false;
      this.modalService.close();
    }, (error) => {
      this.isFormLoading = false;
      this.modalService.close();
      new EntityUtils().handleWSError(this, error);
    });

    this.isFormLoading = true;
  }
}
