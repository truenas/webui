import {
  Component,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/storage/snapshots/snapshots';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import {
  FieldConfig,
} from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'snapshot-clone',
  template: '<entity-form [conf]="this"></entity-form>',
})

export class SnapshotCloneComponent implements FormConfiguration {
  route_success: string[] = ['storage', 'pools'];
  route_cancel: string[] = ['storage', 'snapshots'];
  addCall: 'zfs.snapshot.clone' = 'zfs.snapshot.clone';
  pk: string;
  isEntity = true;
  isNew = true;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.label_clone,
      class: 'clone',
      label: true,
      config: [
        {
          type: 'input',
          name: 'snapshot',
          placeholder: '',
          isHidden: true,
        },
        {
          type: 'input',
          name: 'dataset_dst',
          placeholder: helptext.snapshot_clone_name_placeholder,
          tooltip: helptext.snapshot_clone_name_tooltip,
          required: true,
          validation: helptext.snapshot_clone_name_validation,
        },
      ],
    }];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
  ) {}

  preInit(): void {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params['pk'];
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    entityForm.formGroup.controls['dataset_dst'].setValue(this.setName(this.pk));
    entityForm.formGroup.controls['snapshot'].setValue(this.pk);
  }

  setName(name: string): string {
    let value;
    if (name.indexOf('/') !== -1) {
      value = name.replace('@', '-') + '-clone';
    } else {
      value = name.replace('@', '/') + '-clone';
    }

    return value;
  }
}
