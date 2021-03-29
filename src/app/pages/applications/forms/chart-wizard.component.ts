import { Component, OnDestroy } from '@angular/core';
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
import { EntityUtils, FORM_KEY_SEPERATOR, FORM_LABEL_KEY_PREFIX } from '../../common/entity/utils';
import { Wizard } from '../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../common/entity/entity-wizard/entity-wizard.component';
import { Subject } from 'rxjs';

@Component({
  selector: 'chart-add-wizard',
  template: `<entity-wizard [conf]="this"></entity-wizard>`
})

export class ChartWizardComponent implements OnDestroy {
  protected queryCall: string = 'chart.release.query';
  protected queryCallOption: Array<any>;
  protected customFilter: any[];
  protected addCall: string = 'chart.release.create';
  protected isEntity: boolean = true;
  protected utils: CommonUtils;
  private isLinear = true;
  public summary = {};
  public isAutoSummary: boolean = true;
  public hideCancel = true;
  private title;
  private dialogRef: any;
  protected fieldConfig: FieldConfig[];
  public wizardConfig: Wizard[] = []
  private catalogApp: any;
  private entityWizard: any;
  private destroy$ = new Subject();
  private selectedVersionKey: string;

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService, private appService: ApplicationsService) {
    this.utils = new CommonUtils();
  }

  setTitle(title: string) {
    this.title = title;
  }
  
  setCatalogApp(catalogApp: any) {
    this.catalogApp = catalogApp;
    this.parseSchema();
  }

  parseSchema() {
    try {
      this.title = this.catalogApp.name; 
      const versionKeys = Object.keys(this.catalogApp.versions);
      const versionOptions = versionKeys.map(version => {
        return {
          value: version,
          label: version,
        }
      });

      if (!this.selectedVersionKey) {
        this.selectedVersionKey = versionKeys[0];
      }
      
      const selectedVersion = this.catalogApp.versions[this.selectedVersionKey];

      this.wizardConfig = [];
      this.wizardConfig.push({
        label: helptext.chartWizard.nameGroup.label,
        fieldConfig: [{
          type: 'input',
          name: 'release_name',
          placeholder: helptext.chartForm.release_name.placeholder,
          tooltip: helptext.chartForm.release_name.tooltip,
          required: true,
        },
        {
          type: 'select',
          name: 'version',
          placeholder: helptext.chartWizard.nameGroup.version,
          options: versionOptions,
          value: this.selectedVersionKey,
          required: true,
        }],
      });
      
      selectedVersion.schema.groups.forEach(group => {
        this.wizardConfig.push({
          label: group.name,
          fieldConfig: [],
        })
      });

      selectedVersion.schema.questions.forEach(question => {
        const wizard = this.wizardConfig.find(wizard => wizard.label == question.group);
        if (wizard) {
          const wizardFieldConfigs = new EntityUtils().parseSchemaFieldConfig(question);
          wizard.fieldConfig = wizard.fieldConfig.concat(wizardFieldConfigs);
        }
      });
  
      this.wizardConfig = this.wizardConfig.filter(wizard => wizard.fieldConfig.length > 0);
      if (this.entityWizard) {
        this.entityWizard.resetFields();
        this.entityWizard.formArray.get([0]).get('version').valueChanges.subscribe(value => {
          this.selectedVersionKey = value;
          this.parseSchema();
        });
      }
    } catch(error) {
      return this.dialogService.errorReport(helptext.chartForm.parseError.title, helptext.chartForm.parseError.message);
    }
  }

  afterInit(entityWizard: EntityWizardComponent) {
    this.entityWizard = entityWizard;
    let repositoryConfig = _.find(this.fieldConfig, {'name': 'image_repository'});
    if (repositoryConfig) {
      repositoryConfig.readonly = true;
    }

    entityWizard.formArray.get([0]).get('version').valueChanges.subscribe(value => {
      this.selectedVersionKey = value;
      this.parseSchema();
    });
  }

  customSubmit(data: any) {
    let apiCall = this.addCall;
    delete data.version;

    let values = {};
    new EntityUtils().parseFormControlValues(data, values);

    let payload = [];
    payload.push({
      catalog: this.catalogApp.catalog.id,
      item: this.catalogApp.name,
      release_name: data.release_name,
      train: this.catalogApp.catalog.train,
      version: this.selectedVersionKey,
      values: values
    });

    this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
      helptext.installing) }, disableClose: true});
    this.dialogRef.componentInstance.setCall(apiCall, payload);
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
