import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RestService, WebSocketService } from '../../../../services';
import { AbstractControl, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { T } from '../../../../translate-marker';

import { FieldConfig } from '../../entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../entity/entity-form/services/entity-form.service';
import { FieldRelationService } from '../../entity/entity-form/services/field-relation.service';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';

import { MatSnackBar } from '@angular/material';
import { DialogService } from '../../../../services/';
import { EntityUtils } from '../utils';

@Component({
  selector: 'entity-wizard',
  templateUrl: './entity-wizard.component.html',
  styleUrls: ['./entity-wizard.component.css'],
  providers: [EntityFormService, FieldRelationService]
})
export class EntityWizardComponent implements OnInit {

  @Input('conf') conf: any;

  public formGroup: FormGroup;

  public busy: Subscription;

  public saveSubmitText = T("Submit");
  public customNextText = T("Next");

  get formArray(): AbstractControl | null { return this.formGroup.get('formArray'); }

  constructor(protected rest: RestService, protected ws: WebSocketService,
    private formBuilder: FormBuilder, private entityFormService: EntityFormService,
    protected loader: AppLoaderService, protected fieldRelationService: FieldRelationService,
    public snackBar: MatSnackBar, protected router: Router, protected aroute: ActivatedRoute,
    private dialog: DialogService, protected translate: TranslateService) {

  }

  ngOnInit() {
    if (this.conf.preInit) {
      this.conf.preInit(this);
    }

    let wizardformArray = this.formBuilder.array([]);
    for (let i in this.conf.wizardConfig) {
      wizardformArray.push(this.entityFormService.createFormGroup(this.conf.wizardConfig[i].fieldConfig));
    }

    this.formGroup = this.formBuilder.group({
      formArray: wizardformArray
    });

    for (let i in this.conf.wizardConfig) {
      for (let j in this.conf.wizardConfig[i].fieldConfig) {
        let config = this.conf.wizardConfig[i].fieldConfig[j];
        if (config.relation.length > 0) {
          this.setRelation(config, i);
        }
      }
    }

    if (this.conf.saveSubmitText) {
      this.saveSubmitText = this.conf.saveSubmitText;
    }

    if (this.conf.afterInit) {
      this.conf.afterInit(this);
    }
  }

  isShow(id: any): any {
    if (this.conf.isBasicMode) {
      if (this.conf.advanced_field.indexOf(id) > -1) {
        return false;
      }
    }
    return true;
  }

  goBack() {
    let route = this.conf.route_cancel;
    if (!route) {
      route = this.conf.route_success;
    }
    this.router.navigate(new Array('/').concat(route));
  }

  setRelation(config: FieldConfig, stepIndex: any) {
    let activations = this.fieldRelationService.findActivationRelation(config.relation);
    if (activations) {
      let tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(activations, < FormGroup > this.formArray.get(stepIndex));
      this.setDisabled(config.name, tobeDisabled, stepIndex);

      this.fieldRelationService.getRelatedFormControls(config, < FormGroup > this.formArray.get(stepIndex))
        .forEach(control => {
          control.valueChanges.subscribe(
            () => { this.relationUpdate(config, activations, stepIndex); });
        });
    }
  }

  setDisabled(name: string, disable: boolean, stepIndex: any) {
    if (( < FormGroup > this.formArray.get(stepIndex)).controls[name]) {
      const method = disable ? 'disable' : 'enable';
      ( < FormGroup > this.formArray.get(stepIndex)).controls[name][method]();
      return;
    }

    for (let i in this.conf.wizardConfig) {
      this.conf.wizardConfig[i].fieldConfig = this.conf.wizardConfig[i].fieldConfig.map((item) => {
        if (item.name === name) {
          item.disabled = disable;
        }
        return item;
      });
    }
  }

  relationUpdate(config: FieldConfig, activations: any, stepIndex: any) {
    let tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
      activations, < FormGroup > this.formArray.get(stepIndex));
    this.setDisabled(config.name, tobeDisabled, stepIndex);
  }

  onSubmit() {
    let value = {};
    for (let i in this.formGroup.value.formArray) {
      value = _.merge(value, _.cloneDeep(this.formGroup.value.formArray[i]));
    }

    if (this.conf.beforeSubmit) {
      value = this.conf.beforeSubmit(value);
    }

    if (this.conf.customSubmit) {
      this.busy = this.conf.customSubmit(value);
    } else {
      this.loader.open();

      this.ws.job(this.conf.addWsCall, [value]).subscribe(
        (res) => {
          this.loader.close();
          if (res.error) {
            this.dialog.errorReport(res.error, res.reason, res.exception);
          } else {
            if (this.conf.route_success) {
              this.router.navigate(new Array('/').concat(this.conf.route_success));
            } else {
              this.snackBar.open("All your settings are saved.", 'close', { duration: 5000 })
            }
          }
        },
        (res) => {
          this.loader.close();
          new EntityUtils().handleError(this, res);
        },
      );
    }
  }
}
