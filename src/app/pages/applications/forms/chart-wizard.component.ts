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
  public summary = {};
  public isAutoSummary: boolean = true;

  private title;
  private dialogRef: any;
  protected fieldConfig: FieldConfig[];
  public wizardConfig: Wizard[] = []
  private catalogApp: any;
  private entityWizard: any;
  private destroy$ = new Subject();

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService, private appService: ApplicationsService) {
    this.utils = new CommonUtils();
  }

  createRelations(relations, parentName) {
    const result = relations.map(relation => {
      let relationFieldName = relation[0];
      if (parentName) {
        relationFieldName = `${parentName}${FORM_KEY_SEPERATOR}${relationFieldName}`;
      }
  
      return {
        action: 'SHOW',
        when: [{
          name: relationFieldName,
          operator: relation[1],
          value: relation[2],
        }]
      };
    });

    return result;    
  }

  parseSchemaFieldConfig(schemaConfig, parentName=null, parentIsList=false) {
    let results = [];

    if (schemaConfig.schema.hidden) {
      return results;
    }

    let name = schemaConfig.variable;
    if (!parentIsList && parentName) {
      name = `${parentName}${FORM_KEY_SEPERATOR}${name}`;
    }

    let fieldConfig = {
      required: schemaConfig.schema.required,
      value: schemaConfig.schema.default,
      tooltip: schemaConfig.description,
      placeholder: schemaConfig.label,
      name: name,
    }
    
    if (schemaConfig.schema.editable === false) {
      fieldConfig['readonly'] = true;
    }

    if (schemaConfig.schema.enum) {
      fieldConfig['type'] = 'select';
      fieldConfig['options'] = schemaConfig.schema.enum.map(option => {
        return {
          value: option.value,
          label: option.description,
        }
      });

    } else if (schemaConfig.schema.type == 'string') {
      fieldConfig['type'] = 'input';
        if (schemaConfig.schema.private) {
          fieldConfig['inputType'] = 'password';
          fieldConfig['togglePw'] = true;
        }

        if (schemaConfig.schema.min_length !== undefined) {
          fieldConfig['min'] = schemaConfig.schema.min_length;
        }

        if (schemaConfig.schema.max_length !== undefined) {
          fieldConfig['max'] = schemaConfig.schema.max_length;
        }

    } else if (schemaConfig.schema.type == 'int') {
      fieldConfig['type'] = 'input';
      fieldConfig['inputType'] = 'number';
      
    } else if (schemaConfig.schema.type == 'boolean') {
      fieldConfig['type'] = 'checkbox';

    } else if (schemaConfig.schema.type == 'hostpath') {
      fieldConfig['type'] = 'explorer';
      fieldConfig['explorerType'] = 'file';
      fieldConfig['initial'] = '/mnt';

    } else if (schemaConfig.schema.type == 'path') {
      fieldConfig['type'] = 'input';

    } else if (schemaConfig.schema.type == 'list') {

      fieldConfig['type'] = 'list';
      fieldConfig['label'] = `${helptext.configure} ${schemaConfig.label}`;
      fieldConfig['width'] = '100%';
      fieldConfig['listFields'] = [];

      let listFields = [];
      schemaConfig.schema.items.forEach(item => {
        const fields = this.parseSchemaFieldConfig(item, null, true);
        listFields = listFields.concat(fields);
      });

      fieldConfig['templateListField'] = listFields;

    } else if (schemaConfig.schema.type == 'dict') {
      fieldConfig = null;
      
      if (schemaConfig.schema.attrs.length > 0) {
        const dictLabel = {
          label: schemaConfig.label,
          name: FORM_LABEL_KEY_PREFIX + name,
          type: 'label',
        };

        if (schemaConfig.schema.show_if) {
          dictLabel['relation'] = this.createRelations(schemaConfig.schema.show_if, parentName);
        }

        results = results.concat(dictLabel);
      }

      schemaConfig.schema.attrs.forEach(dictConfig => {
        const subResults = this.parseSchemaFieldConfig(dictConfig, name, parentIsList);

        if (schemaConfig.schema.show_if) {
          subResults.forEach(subResult => {
            subResult['relation'] = this.createRelations(schemaConfig.schema.show_if, parentName);
          });
        }
        results = results.concat(subResults);
      });
    }

    if (fieldConfig) {

      if (fieldConfig['type']) {

        if (schemaConfig.schema.show_if) {
          fieldConfig['relation'] = this.createRelations(schemaConfig.schema.show_if, parentName);
        }

        results.push(fieldConfig);
  
        if (schemaConfig.schema.subquestions) {
          schemaConfig.schema.subquestions.forEach(subquestion => {
    
            const subResults = this.parseSchemaFieldConfig(subquestion, parentName);
    
            if (schemaConfig.schema.show_subquestions_if !== undefined) {
              subResults.forEach(subFieldConfig => {
                subFieldConfig['isHidden'] = true;
                subFieldConfig['relation'] = [{
                  action: 'SHOW',
                  when: [{
                    name: name,
                    value: schemaConfig.schema.show_subquestions_if,
                  }]
                }];
              });
            }
    
            results = results.concat(subResults);
          });
        }  
      } else {
        console.error("Unsupported type=", schemaConfig);
      }
    }

    return results;
  }

  setTitle(title) {
    this.title = title;
  }
  
  parseSchema(catalogApp, isEdit=false) {
    try {
      this.catalogApp = catalogApp;
      this.title = this.catalogApp.name; 
  
      this.catalogApp.schema.groups.forEach(group => {
        this.wizardConfig.push({
          label: group.name,
          fieldConfig: [],
        })
      });

      this.wizardConfig[0].fieldConfig.push({
        type: 'input',
        name: 'release_name',
        placeholder: helptext.chartForm.release_name.placeholder,
        tooltip: helptext.chartForm.release_name.tooltip,
        required: true,
      });

      this.catalogApp.schema.questions.forEach(question => {
        const wizard = this.wizardConfig.find(wizard => wizard.label == question.group);
        if (wizard) {
          const wizardFieldConfigs = this.parseSchemaFieldConfig(question);
          wizard.fieldConfig = wizard.fieldConfig.concat(wizardFieldConfigs);
        }
      });
  
      this.wizardConfig = this.wizardConfig.filter(wizard => wizard.fieldConfig.length > 0);
      
    } catch(error) {
      return this.dialogService.errorReport(helptext.chartForm.parseError.title, helptext.chartForm.parseError.message);
    }
  }

  parseConfigData(configData, parentKey, result) {
    Object.keys(configData).forEach(key => {
      const value = configData[key];
      let fullKey = key;
      if (parentKey) {
        fullKey = `${parentKey}${FORM_KEY_SEPERATOR}${key}`;
      }
      if (!Array.isArray(value) && (value != null && typeof value === 'object')) {
        this.parseConfigData(value, fullKey, result);
      } else {
        result[fullKey] = value;
      }
    });
  }

  resourceTransformIncomingRestData(data) {
    const chartSchema = {
      name: data.chart_metadata.name,
      catalog: {
        id: null,
        label: data.catalog,
      },
      schema: data.chart_schema.schema,
    }

    this.parseSchema(chartSchema, true);
    
    const configData = {};
    this.parseConfigData(data.config, null, configData);
    configData['release_name'] = data.name;
    configData['changed_schema'] = true;
    
    return configData;
  }

  afterInit(entityWizard: EntityWizardComponent) {
    this.entityWizard = entityWizard;
    let repositoryConfig = _.find(this.fieldConfig, {'name': 'image_repository'});
    if (repositoryConfig) {
      repositoryConfig.readonly = true;
    }
  }

  customSubmit(data) {
    let apiCall = this.addCall;
    let values = {};
    new EntityUtils().parseFormControlValues(data, values);

    let payload = [];
    payload.push({
      catalog: this.catalogApp.catalog.id,
      item: this.catalogApp.name,
      release_name: data.release_name,
      train: 'charts',
      version: 'latest',
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
