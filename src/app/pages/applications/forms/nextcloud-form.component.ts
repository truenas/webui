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
export class NextCloudFormComponent {
  protected queryCall: string = 'chart.release.query';
  protected queryCallOption: Array<any>;
  protected addCall: string = 'chart.release.create';
  protected editCall: string = 'chart.release.update';
  protected isEntity: boolean = true;

  private title= 'Nextcloud';
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
      name: 'Configuration',
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'host',
          placeholder: 'Nextcloud Host',
          tooltip: 'Nextcloud host to create application URLs',
        },
        {
          type: 'input',
          name: 'username',
          placeholder: 'Nextcloud Username',
        },
        {
          type: 'input',
          name: 'password',
          togglePw: true,
          placeholder: 'Nextcloud Password',
          options: [],
        },
        {
          type: 'input',
          name: 'nodePort',
          placeholder: 'Nodeport',
          tooltip: 'Node Port to use for Nextcloud'
        },
      ]
    },
    {
      name: helptext.chartForm.container.title,
      // label: true,
      width: '50%',
      config: [
        {
          type: 'checkbox',
          name: 'nextcloudDataHostPathEnabled',
          placeholder: 'Data Hostpath Enabled',
        },
        {
          type: 'explorer',
          name: 'nextcloudHostPath',
          placeholder: 'Data Hostpath',
          initial: '/mnt',
          explorerType: 'directory',
          isHidden: true,
          relation: [
            {
              action: 'SHOW',
              when: [{
                name: 'nextcloudDataHostPathEnabled',
                value: true,
              }]
            },
          ],
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
    console.log(data)
    this.name = data.name;
    data.config.release_name = data.name;
    data.config.username = data.config.nextcloud.username;
    data.config.password = data.config.nextcloud.password;
    data.config.host = data.config.nextcloud.host;
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
    let apiCall = this.addCall;
    let payload = [];
    payload.push({
      catalog: 'OFFICIAL',
      item: 'nextcloud',
      release_name: data.release_name,
      train: 'test',
      version: 'latest',
      values: {
        nextcloud: {
          host: data.host,
          username: data.username,
          password: data.password,
        },
        image: { 
          repository: data.repository,
          pullPolicy: data.pullPolicy,
          tag: data.tag
        },
        service: {
          nodePort: data.nodePort
        },
        nextcloudDataHostPathEnabled: data.nextcloudDataHostPathEnabled,
        nextcloudHostPath: data.nextcloudHostPath
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
