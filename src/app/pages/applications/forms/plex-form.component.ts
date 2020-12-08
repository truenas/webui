import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { DialogService } from '../../../services/index';
import { SystemGeneralService } from 'app/services/system-general.service';
import { map } from 'rxjs/operators';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { ModalService } from '../../../services/modal.service';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import  helptext  from '../../../helptext/apps/apps';

@Component({
  selector: 'app-chart-release-edit',
  template: `<entity-form [conf]="this"></entity-form>`,
  // providers: [SystemGeneralService]
})
export class PlexFormComponent {
  protected queryCall: string = 'chart.release.query';
  protected queryCallOption: Array<any>;
  protected addCall: string = 'chart.release.create';
  protected editCall: string = 'chart.release.update';
  protected isEntity: boolean = true;

  private title= 'Plex';
  private name: string;
  private getRow = new Subscription;
  private rowName: string;
  private dialogRef: any;
  protected fieldConfig: FieldConfig[];
  public fieldSets: FieldSet[] = [
    {
      name: 'Name',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'release_name',
          placeholder: helptext.chartForm.release_name.placeholder,
          tooltip: helptext.chartForm.release_name.tooltip,
        }
      ],
      colspan: 2
    },
    {
      name: helptext.chartForm.image.title,
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'repository',
          placeholder: helptext.chartForm.image.repo.placeholder,
          tooltip: helptext.chartForm.image.repo.tooltip,
          required: true
        },
        {
          type: 'input',
          name: 'tag',
          placeholder: helptext.chartForm.image.tag.placeholder,
          tooltip: helptext.chartForm.image.tag.tooltip,
          value: 'latest'
        },
        {
          type: 'select',
          name: 'pullPolicy',
          placeholder: helptext.chartForm.image.pullPolicy.placeholder,
          tooltip: helptext.chartForm.image.pullPolicy.tooltip,
          options: helptext.chartForm.image.pullPolicy.options,
          value: helptext.chartForm.image.pullPolicy.options[0].value
        }
      ]
    },
    {
      name: 'Settings',
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'claimToken',
          placeholder: 'Plex Claim Token',
        },
        {
          type: 'input',
          name: 'advertiseIp',
          placeholder: 'Plex Advertise IP',
        },
        {
          type: 'combobox',
          name: 'timezone',
          placeholder: 'Timezone',
          options: [],
        },
        {
          type: 'checkbox',
          name: 'hostNetwork',
          placeholder: 'Host Network',
        },
      ]
    },
    {
      name: 'Extra Environment Variables',
      label: true,
      config: [
        {
          type: 'list',
          name: 'extraEnv',
          width: '100%',
          box: true,
          templateListField: [
            {
              type: 'input',
              name: 'name',
              placeholder: helptext.chartForm.container.env_vars.key.placeholder,
              tooltip: helptext.chartForm.container.env_vars.key.tooltip,
            }, 
            {
              type: 'input',
              name: 'value',
              placeholder: helptext.chartForm.container.env_vars.value.placeholder,
              tooltip: helptext.chartForm.container.env_vars.value.tooltip,
            }
          ],
          listFields: []
        }
      ],
      colspan: 2,
    },
    {
      name: 'Plexservice TCP',
      label: true,
      config: [
        {
          type: 'input',
          name: 'port',
          placeholder: 'Plexservice TCP',
          validation: helptext.chartForm.portForwardingList.containerPort.validation,
        }
      ],
      colspan: 2,
    },
    {
      name: helptext.chartForm.container.title,
      // label: true,
      width: '50%',
      config: [
        {
          type: 'checkbox',
          name: 'transcodeHostPathEnabled',
          placeholder: 'Transcode Hostpath Enabled',
        },
        {
          type: 'explorer',
          name: 'transcodeHostPath',
          placeholder: 'Transcode Hostpath',
          initial: '/mnt',
          explorerType: 'directory',
          isHidden: true,
          relation: [
            {
              action: 'SHOW',
              when: [{
                name: 'transcodeHostPathEnabled',
                value: true,
              }]
            },
          ],
        },
        {
          type: 'checkbox',
          name: 'dataHostPathEnabled',
          placeholder: 'Data Hostpath Enabled',
        },
        {
          type: 'explorer',
          name: 'dataHostPath',
          placeholder: 'Data Hostpath',
          initial: '/mnt',
          explorerType: 'directory',
          isHidden: true,
          relation: [
            {
              action: 'SHOW',
              when: [{
                name: 'dataHostPathEnabled',
                value: true,
              }]
            },
          ],
        },
        {
          type: 'checkbox',
          name: 'configHostPathEnabled',
          placeholder: 'Config Hostpath Enabled',
        },
        {
          type: 'explorer',
          name: 'configHostPath',
          placeholder: 'Config Hostpath',
          initial: '/mnt',
          explorerType: 'directory',
          isHidden: true,
          relation: [
            {
              action: 'SHOW',
              when: [{
                name: 'configHostPathEnabled',
                value: true,
              }]
            },
          ],
        },

      ]
    },
    {
      name: helptext.chartForm.gpu.title,
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'gpu_property',
          placeholder: helptext.chartForm.gpu.property.placeholder,
          tooltip: helptext.chartForm.gpu.property.tooltip,
        },
        {
          type: 'input',
          name: 'gpu_value',
          placeholder: helptext.chartForm.gpu.value.placeholder,
        }
      ]
    }
  ]

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService, private sysGeneralService: SystemGeneralService) {
      this.getRow = this.modalService.getRow$.subscribe((rowName: string) => {
        this.rowName = rowName;
        this.queryCallOption = [["id", "=", rowName]];
        this.getRow.unsubscribe();
    })
     }

  resourceTransformIncomingRestData(data) {
    this.name = data.name;
    data.config.release_name = data.name;
    data.config.repository = data.config.image.repository;
    data.config.tag = data.config.image.tag;
    data.config.pullPolicy = data.config.image.pullPolicy;
    return data.config;
  }

  afterInit(entityEdit: any) {
    if (this.rowName) {
      entityEdit.setDisabled('release_name', true, false);
    }

    this.sysGeneralService.timezoneChoices().subscribe(tzChoices => {
      tzChoices = _.sortBy(tzChoices, [function(o) { return o.label.toLowerCase(); }]);
      this.fieldSets
        .find(set => set.name === 'Settings')
        .config.find(config => config.name === 'timezone').options = tzChoices;
        // this.entityForm.formGroup.controls['timezone'].setValue(this.configData.timezone);
    });
  }

  customSubmit(data) {
    let apiCall = this.addCall;
    let envObj = {};
    data.extraEnv.forEach(item => {
      let key = envObj[name]
      envObj[item.name] = item.value;
    })

    let GPUObj = {};
    GPUObj[data.gpu_property] = data.gpu_value;

    let payload = [];
    payload.push({
      catalog: 'OFFICIAL',
      item: 'plex',
      release_name: data.release_name,
      train: 'test',
      version: 'latest',
      values: {
        advertiseIp: data.advertiseIp,
        claimToken: data.claimToken,
        extraEnv: envObj,
        hostNetwork: data.hostNetwork,
        plexServiceTCP: { port: data.port },
        gpuConfiguration: GPUObj,
        image: { 
          repository: data.repository,
          pullPolicy: data.pullPolicy,
          tag: data.tag
        },
        configHostPathEnabled: data.configHostPathEnabled,
        dataHostPathEnabled: data.dataHostPathEnabled,
        transcodeHostPathEnabled: data.transcodeHostPathEnabled,
        configHostPath: data.configHostPath,
        dataHostPath: data.dataHostPath,
        transcodeHostPath: data.transcodeHostPath,
        timezone: data.timezone
      }
    });

    if (this.rowName) {
      delete payload[0].catalog;
      delete payload[0].item;
      delete payload[0].release_name;
      delete payload[0].train;
      delete payload[0].version;
      payload.unshift(this.name);
      apiCall = this.editCall;
    }
    this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
      helptext.installing) }, disableClose: true});
    this.dialogRef.componentInstance.setCall(apiCall, payload);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.modalService.close('slide-in-form');
      this.modalService.refreshTable();
    });
    this.dialogRef.componentInstance.failure.subscribe((err) => {
      // new EntityUtils().handleWSError(this, err, this.dialogService);
    })
  }

}
