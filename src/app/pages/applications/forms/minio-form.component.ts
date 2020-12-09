import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { DialogService } from '../../../services/index';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { ModalService } from '../../../services/modal.service';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import  helptext  from '../../../helptext/apps/apps';

@Component({
  selector: 'app-chart-release-edit',
  template: `<entity-form [conf]="this"></entity-form>`,
})
export class MinioFormComponent {
  protected queryCall: string = 'chart.release.query';
  protected queryCallOption: Array<any>;
  protected addCall: string = 'chart.release.create';
  protected editCall: string = 'chart.release.update';
  protected isEntity: boolean = true;

  private title = helptext.minioForm.title;
  private name: string;
  private getRow = new Subscription;
  private rowName: string;
  private dialogRef: any;
  protected fieldConfig: FieldConfig[];
  public fieldSets: FieldSet[] = [
    {
      name: helptext.nextCloudForm.release_name.name,
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'release_name',
          placeholder: helptext.chartForm.release_name.placeholder,
          tooltip: helptext.chartForm.release_name.tooltip,
          required: true
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
          required: true,
          value: 'minio/minio'
        },
        {
          type: 'input',
          name: 'tag',
          placeholder: helptext.chartForm.image.tag.placeholder,
          tooltip: helptext.chartForm.image.tag.tooltip,
          value: 'RELEASE.2020-11-19T23-48-16Z'
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
      name: helptext.minioForm.accessLabel,
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'accessKey',
          togglePw: true,
          placeholder: helptext.minioForm.accessKey.placeholder,
          tooltip: helptext.minioForm.accessKey.tooltip,
          // validation: helptext.minioForm.accessKey.validation,
          required: true
        },
        {
          type: 'input',
          name: 'secretKey',
          togglePw: true,
          placeholder: helptext.minioForm.secretKey.placeholder,
          tooltip: helptext.minioForm.secretKey.tooltip,
          // validation: helptext.minioForm.secretKey.validation,
          required: true
        },
      ]
    },
    {
      name: helptext.minioForm.environment.label,
      label: true,
      config: [
        {
          type: 'list',
          name: 'environment',
          width: '100%',
          box: true,
          templateListField: [
            {
              type: 'input',
              name: 'name',
              placeholder: helptext.minioForm.environment.name,
            }, 
            {
              type: 'input',
              name: 'value',
              placeholder: helptext.minioForm.environment.value,
            }
          ],
          listFields: []
        }
      ],
      colspan: 2,
    },
    {
      name: helptext.minioForm.nodePort.label,
      config: [
        {
          type: 'input',
          name: 'nodePort',
          placeholder: helptext.minioForm.nodePort.placeholder,
          tooltip: helptext.minioForm.nodePort.tooltip,
          validation: helptext.chartForm.portForwardingList.containerPort.validation,
          value: 9000
        }
      ],
      colspan: 2,
    },
    {
      name: 'hostpath',
      width: '50%',
      config: [
        {
          type: 'checkbox',
          name: 'minioHostPathEnabled',
          placeholder: helptext.minioForm.hostPathEnabled,
        },
        {
          type: 'explorer',
          name: 'minioHostPath',
          placeholder: helptext.minioForm.hostPath.placeholder,
          tooltip: helptext.minioForm.hostPath.tooltip,
          initial: '/mnt',
          explorerType: 'directory',
          isHidden: true,
          relation: [
            {
              action: 'SHOW',
              when: [{
                name: 'minioHostPathEnabled',
                value: true,
              }]
            },
          ],
        }
      ]
    }
  ]

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService) {
      this.getRow = this.modalService.getRow$.subscribe((rowName: string) => {
        this.rowName = rowName;
        this.queryCallOption = [["id", "=", rowName]];
        this.getRow.unsubscribe();
    })
  }

  resourceTransformIncomingRestData(data) {
    console.log(data)
    this.name = data.name;
    data.config.release_name = data.name;
    // data.config.username = data.config.nextcloud.username;
    // data.config.password = data.config.nextcloud.password;
    // data.config.host = data.config.nextcloud.host;
    data.config.repository = data.config.image.repository;
    data.config.tag = data.config.image.tag;
    data.config.pullPolicy = data.config.image.pullPolicy;
    data.config.nodePort = data.config.service.nodePort;
    return data.config;
  }

  afterInit(entityEdit: any) {
    if (this.rowName) {
      entityEdit.setDisabled('release_name', true, false);
    }
  }

  customSubmit(data) {
    console.log(data)
    let envObj = {};
    data.environment.forEach(item => {
      let key = envObj[name]
      envObj[item.name] = item.value;
    })
    let apiCall = this.addCall;
    let payload = [];
    payload.push({
      catalog: 'OFFICIAL',
      item: 'minio',
      release_name: data.release_name,
      train: 'test',
      version: 'latest',
      values: {
        accessKey: data.accessKey,
        secretKey: data.secretKey,
        environment: envObj,
        image: { 
          repository: data.repository,
          pullPolicy: data.pullPolicy,
          tag: data.tag
        },
        service: {
          nodePort: data.nodePort
        },
        minioHostPathEnabled: data.minioHostPathEnabled,
        minioHostPath: data.minioHostPath
      }
    });
    console.log(payload)

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
