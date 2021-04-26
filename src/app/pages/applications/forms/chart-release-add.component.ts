import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash';
import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { Wizard } from '../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../common/entity/entity-wizard/entity-wizard.component';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { ModalService } from 'app/services/modal.service';
import { DialogService } from '../../../services/index';
import { ApplicationsService } from '../applications.service';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import  helptext  from '../../../helptext/apps/apps';
import { FormListComponent } from '../../common/entity/entity-form/components/form-list/form-list.component';
import { EntityUtils } from '../../common/entity/utils';

@Component({
  selector: 'app-chart-release-add',
  template: `<entity-wizard [conf]="this"></entity-wizard>`

})
export class ChartReleaseAddComponent implements OnDestroy {
  protected queryCall: string = 'chart.release.query';
  protected queryCallOption: Array<any>;
  protected addCall: string = 'chart.release.create';
  protected isEntity: boolean = true;

  private title = helptext.chartForm.title;
  private dialogRef: any;
  public hideCancel = true;
  public summary = {};
  summary_title = 'Chart Release Summary';
  private entityWizard: any;
  private destroy$ = new Subject();
  // private isLinear = true;
  private interfaceList = [];
  private entityUtils = new EntityUtils();

  protected fieldConfig: FieldConfig[];
  public wizardConfig: Wizard[] = [
    {
      label: helptext.wizardLabels.image,
      fieldConfig: [
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
        },
        {
          type: 'select',
          name: 'updateStrategy',
          placeholder: helptext.chartForm.update.placeholder,
          tooltip: helptext.chartForm.update.tooltip,
          options: helptext.chartForm.update.options,
          value: helptext.chartForm.update.options[0].value
        },
      ]
    },
    {
      label: helptext.wizardLabels.container,
      fieldConfig: [
        {
          type: 'chip',
          name: 'containerCommand',
          placeholder: helptext.chartForm.container.command.placeholder,
          tooltip: helptext.chartForm.container.command.tooltip,
        },
        {
          type: 'chip',
          name: 'containerArgs',
          placeholder: helptext.chartForm.container.args.placeholder,
          tooltip: helptext.chartForm.container.args.tooltip
        },
        {
          type: 'list',
          name: 'containerEnvironmentVariables',
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
        }
      ]
    },
  ]

  private summaryItems = [
    { step: 0, fieldName:'release_name', label: helptext.chartForm.release_name.placeholder},
    { step: 0, fieldName:'repository', label: helptext.chartForm.image.repo.placeholder},
    { step: 0, fieldName:'tag', label: helptext.chartForm.image.tag.placeholder},
    { step: 1, fieldName:'containerCommand', label: helptext.chartForm.container.command.placeholder}
  ]

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService, private appService: ApplicationsService) {
      this.appService.getNICChoices().subscribe(res => {
        for (let item in res) {
          this.interfaceList.push({ label: item, value: item})
        }
      })
     }

  afterInit(entityWizard: EntityWizardComponent) {
    this.entityWizard = entityWizard;
    this.summaryItems.forEach(item => {
      this.makeSummary(item.step, item.fieldName, item.label);
    })
  }

  parseSchema(catalogApp) {
    try {

      const gpuConfiguration = catalogApp.schema.questions.find(question => question.variable=='gpuConfiguration');

      if (gpuConfiguration && gpuConfiguration.schema.attrs.length > 0) {
        const fieldConfigs = this.entityUtils.parseSchemaFieldConfig(gpuConfiguration);
        const gpuWizardConfig = {
          label: gpuConfiguration.group,
          fieldConfig: fieldConfigs
        };

        this.wizardConfig.push(gpuWizardConfig);
      }

    } catch(error) {
      return this.dialogService.errorReport(helptext.chartForm.parseError.title, helptext.chartForm.parseError.message);
    }
  }

  makeSummary(step: string | number, fieldName: string | number, label: string | number) {
    ( < FormGroup > this.entityWizard.formArray.get([step]).get(fieldName)).valueChanges
    .pipe(
      takeUntil(this.destroy$)
    )
    .subscribe((res) => {
      this.summary[(label)] = res;
    })
  }

  hideField(fieldName: any, show: boolean, entity: any) {
    let target = _.find(this.fieldConfig, {'name' : fieldName});
    target['isHidden'] = show;
    entity.setDisabled(fieldName, show, show);
  }

  customSubmit(data) {

    let parsedData = {};
    this.entityUtils.parseFormControlValues(data, parsedData);

    let envVars = [];
    if (data.containerEnvironmentVariables && data.containerEnvironmentVariables.length > 0 && data.containerEnvironmentVariables[0].name) {
      envVars = data.containerEnvironmentVariables;
    }

    let pfList = [];
    if (data.portForwardingList && data.portForwardingList.length > 0 && data.portForwardingList[0].containerPort) {
      pfList = data.portForwardingList;
    }

    let hpVolumes = [];
    if (data.hostPathVolumes && data.hostPathVolumes.length > 0 && data.hostPathVolumes[0].hostPath) {
      hpVolumes = data.hostPathVolumes;
    }

    let volList = [];
    if (data.volumes && data.volumes.length > 0 && data.volumes[0].datasetName) {
      volList = data.volumes;
    }

    let ext_interfaces = [];
    if (data.externalInterfaces && data.externalInterfaces.length > 0 && data.externalInterfaces[0].hostInterface) {
      data.externalInterfaces.forEach(i => {
        if (i.ipam !== 'static') {
          ext_interfaces.push(
            {
              hostInterface: i.hostInterface,
              ipam: {
                type: i.ipam,
              }
            }
          );
        } else {
          let ipList = [];
          if (i.staticIPConfigurations && i.staticIPConfigurations.length > 0) {
            i.staticIPConfigurations.forEach(item => {
              ipList.push(item.staticIP);
            })
          }
          ext_interfaces.push(
            {
              hostInterface: i.hostInterface,
              ipam: {
                type: i.ipam,
                staticIPConfigurations: ipList,
                staticRoutes: i.staticRoutes
              }
            }
          );
        }
      })
    }

    let payload = [{
      catalog: 'OFFICIAL',
      item: 'ix-chart',
      release_name: data.release_name,
      train: 'charts',
      version: 'latest',
      values: {
        containerArgs: data.containerArgs,
        containerCommand: data.containerCommand,
        containerEnvironmentVariables: envVars,
        dnsConfig: {
          nameservers: data.nameservers,
          searches: data.searches
        },
        dnsPolicy: data.dnsPolicy,
        externalInterfaces: ext_interfaces,
        hostPathVolumes: hpVolumes,
        hostNetwork: data.hostNetwork,
        image: {
          repository: data.repository,
          pullPolicy: data.pullPolicy,
          tag: data.tag
        },
        portForwardingList: pfList,
        updateStrategy: data.updateStrategy,
        volumes: volList,
        workloadType: 'Deployment',
        securityContext: {
          privileged: data.privileged,
        }
      }
    }];

    if (parsedData['gpuConfiguration']) {
      payload[0].values['gpuConfiguration'] = parsedData['gpuConfiguration'];
    }

    this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
      helptext.installing) }, disableClose: true});
    this.dialogRef.componentInstance.setCall(this.addCall, payload);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.modalService.close('slide-in-form');
      this.modalService.refreshTable();
    });
  }

  ngOnDestroy(){
    this.destroy$.next();
    this.destroy$.complete();
  }

}
