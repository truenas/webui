import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FieldRelationService } from '../../../common/entity/entity-form/services/field-relation.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';

@Component({
  selector: 'app-alertservice',
  templateUrl: './alert-service.component.html',
  providers: [EntityFormService, FieldRelationService]
})
export class AlertServiceComponent implements OnInit {

  protected addCall = 'alertservice.create';
  public route_success: string[] = ['system', 'alertservice'];
  protected isNew = true;
  protected isEntity = true;
  public selectedType = 'Mail';

  public fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'name',
      placeholder: 'Name',
    },
    {
      type: 'select',
      name: 'type',
      placeholder: 'Type',
      options: [{
        label: 'E-Mail',
        value: 'Mail',
      }, {
        label: 'SNMP Trap',
        value: 'SNMPTrap',
      }],
      value: 'Mail',
    },
  ];

  public emailFieldConfig: FieldConfig[] = [{
      type: 'input',
      inputType: 'email',
      name: 'email_address',
      placeholder: 'E-mail address',
    },
    {
      type: 'checkbox',
      name: 'enabled',
      placeholder: 'Enabled',
    }
  ];

  public snmpTrapFieldConfig: FieldConfig[] = [{
    type: 'checkbox',
    name: 'enabled',
    placeholder: 'Enabled',
  }];

  public formGroup: any;
  public activeFormGroup: any;
  public emailFormGroup: any;
  public snmpTrapFormGroup: any;

  constructor(protected router: Router,
    protected route: ActivatedRoute,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected entityFormService: EntityFormService,
    protected fieldRelationService: FieldRelationService,
    protected loader: AppLoaderService,) {}

  ngOnInit() {
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    this.emailFormGroup = this.entityFormService.createFormGroup(this.emailFieldConfig);
    this.snmpTrapFormGroup = this.entityFormService.createFormGroup(this.snmpTrapFieldConfig);

    this.activeFormGroup = this.emailFormGroup;
    this.formGroup.controls['type'].valueChanges.subscribe((res) => {
      this.selectedType = res;
      if (res == 'Mail') {
        this.activeFormGroup = this.emailFormGroup;
      } else if (res == 'SNMPTrap') {
        this.activeFormGroup = this.snmpTrapFormGroup;
      }
    });
  }

  onSubmit(event: Event) {
    console.log(this.formGroup.value, this.activeFormGroup.value);
    let payload = _.cloneDeep(this.formGroup.value);
    let serviceValue = _.cloneDeep(this.activeFormGroup.value);

    payload['attributes'] = serviceValue;
    payload['settings'] = {};

    this.loader.open();
    this.ws.call(this.addCall, [payload]).subscribe(
      (res) => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (res) => {
        this.loader.close();
      });
  }

  sendTestAlet() {

  }
}
