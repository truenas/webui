import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { helptext_system_bootenv } from 'app/helptext/system/boot-env';
import { regexValidator } from 'app/pages/common/entity/entity-form/validators/regex-validation';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
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
  private rename = false;
  currentName?: string;

  formGroup = this.formBuilder.group({
    name: ['', [Validators.required, regexValidator(this.bootEnvService.bootenv_name_regex)]],
  });

  isFormLoading = false;

  readonly tooltips = {
    name: helptext_system_bootenv.create_name_tooltip,
  };

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private bootEnvService: BootEnvService,
    private modalService: IxModalService,
    private errorHandler: FormErrorHandlerService,
  ) {}

  setupForm(name?: string): void {
    if (name) {
      this.rename = true;
      this.currentName = name;
      this.formGroup.patchValue({
        name,
      });
    }
  }

  onSubmit(): void {
    const fields = {
      name: this.formGroup.value.name,
    };

    let request$: Observable<unknown>;

    if (this.rename) {
      request$ = this.ws.call('bootenv.update', [
        this.currentName,
        fields,
      ]);
    } else {
      request$ = this.ws.call('bootenv.create', [fields]);
    }

    this.isFormLoading = true;
    request$.pipe(untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = false;
      this.modalService.close();
    }, (error) => {
      this.isFormLoading = false;
      this.errorHandler.handleWsFormError(error, this.formGroup);
    });
  }
}
