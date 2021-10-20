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

    if (this.rename) {
      const update$: Observable<unknown> = this.ws.call('bootenv.update', [
        this.currentName,
        fields,
      ]);

      update$.pipe(untilDestroyed(this)).subscribe(() => {
        this.isFormLoading = false;
        this.modalService.close();
      }, (error) => {
        this.isFormLoading = false;
        this.modalService.close();
        new EntityUtils().handleWSError(this, error);
      });
    } else {
      const create$: Observable<unknown> = this.ws.call('bootenv.create', [fields]);

      create$.pipe(untilDestroyed(this)).subscribe(() => {
        this.isFormLoading = false;
        this.modalService.close();
      }, (error) => {
        this.isFormLoading = false;
        this.modalService.close();
        new EntityUtils().handleWSError(this, error);
      });
    }

    this.isFormLoading = true;
  }
}
