import { Component } from '@angular/core';
import * as _ from 'lodash';

import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { ModalService } from 'app/services/modal.service';
import  helptext  from '../../../helptext/apps/apps';
import { ApplicationsService } from '../applications.service';

@Component({
  selector: 'app-chart-release-settings',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class ChartReleaseSettingsComponent {
  // protected queryCall: string = 'kubernetes.config';
  protected addCall: string = 'chart.release.create';
  protected editCall: string = 'chart.release.update';
  private title = helptext.chartForm.title;
  private entityEdit: any;
  protected fieldConfig: FieldConfig[];
  public fieldSets: FieldSet[] = [
    {
      name: 'chart_release_settings',
      config: [
        {
          type: 'input',
          name: 'release_name',
          placeholder: helptext.chartForm.release_name.placeholder,
          tooltip: helptext.chartForm.release_name.tooltip,
          required: true
        },
        {
          type: 'input',
          name: 'repository',
          placeholder: helptext.chartForm.repository.placeholder,
          tooltip: helptext.chartForm.repository.tooltip,
          required: true
        },
        {
          type: 'input',
          name: 'catalog',
          placeholder: helptext.chartForm.catalog.placeholder,
          tooltip: helptext.chartForm.catalog.tooltip,
          required: true,
          value: 'OFFICIAL'
        },
        {
          type: 'input',
          name: 'item',
          placeholder: helptext.chartForm.item.placeholder,
          tooltip: helptext.chartForm.item.tooltip,
          required: true,
          value: 'ix-chart'
        },
        {
          type: 'input',
          name: 'train',
          placeholder: helptext.chartForm.train.placeholder,
          tooltip: helptext.chartForm.train.tooltip,
          required: true,
          value: 'test'
        },
        {
          type: 'input',
          name: 'version',
          placeholder: helptext.chartForm.version.placeholder,
          tooltip: helptext.chartForm.version.tooltip,
          required: true,
          value: 'latest'
        }
      ]
    }
  ]

  constructor() {}

  customSubmit(data) {
    console.log(data)
  }

}