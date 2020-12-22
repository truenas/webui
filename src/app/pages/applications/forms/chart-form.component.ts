import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { DialogService } from '../../../services/index';
import { ApplicationsService } from '../applications.service';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { ModalService } from '../../../services/modal.service';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { CommonUtils } from 'app/core/classes/common-utils';
import  helptext  from '../../../helptext/apps/apps';

@Component({
  selector: 'chart-form',
  template: `<entity-form [conf]="this"></entity-form>`,
})
export class ChartFormComponent {
  protected queryCall: string = 'chart.release.query';
  protected queryCallOption: Array<any>;
  protected addCall: string = 'chart.release.create';
  protected editCall: string = 'chart.release.update';
  protected isEntity: boolean = true;
  protected utils: CommonUtils;

  private title = helptext.nextCloudForm.title;
  private name: string;
  private getRow = new Subscription;
  private rowName: string;
  private dialogRef: any;
  protected fieldConfig: FieldConfig[];
  public fieldSets: FieldSet[] = [];

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService, private appService: ApplicationsService, private catalogApp: Object) {
      this.parseSchema();

      this.getRow = this.modalService.getRow$.subscribe((rowName: string) => {
        this.rowName = rowName;
        this.queryCallOption = [["id", "=", rowName]];
        this.getRow.unsubscribe();
    })
    this.utils = new CommonUtils();
  }

  parseSchema() {
    this.fieldSets = [
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
            value: 'nextcloud',
            readonly: true
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
        name: helptext.nextCloudForm.config.label,
        label: true,
        width: '50%',
        config: [
          {
            type: 'input',
            name: 'host',
            placeholder: helptext.nextCloudForm.config.host.placeholder,
            tooltip: helptext.nextCloudForm.config.host.tooltip,
          },
          {
            type: 'input',
            name: 'username',
            placeholder: helptext.nextCloudForm.config.username,
          },
          {
            type: 'input',
            name: 'password',
            togglePw: true,
            placeholder: helptext.nextCloudForm.config.password,
          },
          {
            type: 'input',
            name: 'nodePort',
            placeholder: helptext.nextCloudForm.config.nodeport.placeholder,
            tooltip: helptext.nextCloudForm.config.nodeport.tooltip,
            value: 9001
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
            placeholder: helptext.nextCloudForm.nextcloudPath,
            value: false
          },
          {
            type: 'explorer',
            name: 'nextcloudHostPath',
            placeholder: helptext.nextCloudForm.nextcloudPath,
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
  }

  resourceTransformIncomingRestData(data) {
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
    entityEdit.formGroup.markAsDirty();
    // if (this.rowName) {
    //   entityEdit.setDisabled('release_name', true, false);
    // }

    // this.appService.getAllCatalogItems().subscribe(res => {
    //   // let versions = res[0].trains.charts.nextcloud.versions;
    //   // let sorted_version_labels = Object.keys(versions);
    //   // sorted_version_labels.sort(this.utils.versionCompare);

    //   // let ncValues = res[0].trains.charts.nextcloud.versions[sorted_version_labels[0]].values;
    //   // let questions = res[0].trains.charts.nextcloud.versions[sorted_version_labels[0]].schema.questions;
    //   // console.log('questions', questions)
    //   // let nc = questions.find(o => o.variable === 'nextcloud');
    //   // let attrs = nc.schema.attrs;
    //   // let host = attrs.find(o => o.variable === 'host');
    //   // entityEdit.formGroup.controls['username'].setValue(ncValues.nextcloud.username);
    //   // entityEdit.formGroup.controls['password'].setValue(ncValues.nextcloud.password);
    //   // entityEdit.formGroup.controls['nodePort'].setValue(ncValues.service.nodePort);
    //   // if (!this.rowName) {
    //   //   entityEdit.formGroup.controls['host'].setValue(host.schema.default);
    //   // };
    // })
  }

  customSubmit(data) {
    let apiCall = this.addCall;
    let payload = [];
    payload.push({
      catalog: 'OFFICIAL',
      item: 'nextcloud',
      release_name: data.release_name,
      train: 'charts',
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
