import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { helptext_system_bootenv } from 'app/helptext/system/boot-env';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { regexValidator } from 'app/pages/common/entity/entity-form/validators/regex-validation';
import { BootEnvService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-bootenv-add',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [BootEnvService],
})
export class BootEnvironmentCloneComponent implements FormConfiguration {
  route_success: string[] = ['system', 'boot'];
  addCall: 'bootenv.create' = 'bootenv.create';
  pk: string;
  isNew = true;
  isEntity = true;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext_system_bootenv.clone_fieldset,
      class: 'clone',
      label: true,
      config: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptext_system_bootenv.clone_name_placeholder,
          tooltip: helptext_system_bootenv.clone_name_tooltip,
          validation: [regexValidator(this.bootEnvService.bootenv_name_regex)],
          required: true,
        },
        {
          type: 'input',
          name: 'source',
          placeholder: helptext_system_bootenv.clone_source_placeholder,
          tooltip: helptext_system_bootenv.clone_source_tooltip,
          readonly: true,
        },
      ],
    }];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected bootEnvService: BootEnvService,
  ) {}

  afterInit(entityForm: EntityFormComponent): void {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params['pk'];
      entityForm.formGroup.get('source').setValue(this.pk);
    });
  }
}
