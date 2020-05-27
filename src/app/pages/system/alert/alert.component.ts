import { Component, OnInit } from '@angular/core';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { T } from 'app/translate-marker';
import { DialogService, WebSocketService } from '../../../services/';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';
import * as _ from 'lodash';
import helptext from '../../../helptext/system/alert-settings';

interface AlertCategory {
  id: string;
  title: string;
  classes: {
    id: string;
    title: string;
    level: string;
  }[];
} 

/**
 * This form is unlike other forms in the app which make use of EntityForm.
 * This component's form config is generated based on a response from the
 * middleware.
 */
@Component({
  selector: 'app-system-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['../../common/entity/entity-form/entity-form.component.scss'],
  providers: [EntityFormService],
})
export class AlertConfigComponent implements OnInit {
  protected route_success = ['system', 'alertsettings'];
  protected queryCall = 'alertclasses.config';
  protected editCall = 'alertclasses.update';
  protected isEntity = true;
  public fieldSets: FieldSets;
  public fieldConfig: FieldConfig[] = [];
  protected settingOptions: any = [];
  protected warningOptions: any = [
    {label: "INFO", value: "INFO"},
    {label: "NOTICE", value: "NOTICE"},
    {label: "WARNING", value: "WARNING"},
    {label: "ERROR", value: "ERROR"},
    {label: "CRITICAL", value: "CRITICAL"},
    {label: "ALERT", value: "ALERT"},
    {label: "EMERGENCY", value: "EMERGENCY"},
  ];
  public formGroup: any;
  public settingFormGroup: any;
  public isReady = false;
  public isFooterConsoleOpen: boolean;
  protected defaults = [];

  constructor(
    private ws: WebSocketService,
    private entityFormService: EntityFormService,
    protected loader: AppLoaderService,
    public dialog: DialogService
  ) {}

  async ngOnInit() {
    this.loader.open();
    this.ws.call('alert.list_policies', []).subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        let label = res[i];
        if (res[i] === "IMMEDIATELY") {
          label = res[i] + ' (Default)';
        }
        this.settingOptions.push({ label: label, value: res[i] });
      }
    });

    this.ws.call('system.advanced.config').subscribe((res)=> {
      if (res) {
        this.isFooterConsoleOpen = res.consolemsg;
      }
    });
  
    const sets: FieldSet[] = [];

    const categories: AlertCategory[] = await this.ws.call("alert.list_categories").toPromise();
    categories.forEach((category, index) => {
      const modulo = index % 2;

      let config = [];
      for (let i = 0; i < category.classes.length; i++) {
        const c = category.classes[i];
        const warningOptions = [];
        for (let j = 0; j < this.warningOptions.length; j++) {
          const option  = JSON.parse(JSON.stringify( this.warningOptions[j] )); // apparently this is the proper way to clone an object
          if (option.value === c.level) {
            option.label = option.label + " (Default)";
          }
          warningOptions.push(option);
        }
        config.push({
          type: "select",
          name: c.id + '_level',
          inlineLabel: c.title,
          placeholder: T("Set Warning Level"),
          tooltip: helptext.level_tooltip,
          options: warningOptions,
          value: c.level
        },
        {
          type: "select",
          name: c.id + '_policy',
          inlineLabel: " ",
          placeholder: T("Set Frequency"),
          tooltip: helptext.policy_tooltip,
          options: this.settingOptions,
          value: "IMMEDIATELY"
        });

        this.defaults.push({id: c.id, level: c.level, policy: 'IMMEDIATELY'});
      }

      let fieldSet = {
        name: category.title,
        label: true,
        width: "40%",
        config: config
      }
    
      sets.push(fieldSet);

      if(modulo == 1 && index < categories.length - 2){
        sets.push({ name: 'divider', divider: true },);
      }

    });

    /* Final divider before action buttons */
    sets.push({ name: 'divider', divider: true });

    this.fieldSets = new FieldSets(sets);

    this.fieldConfig = this.fieldSets.configs();
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

    this.ws.call(this.queryCall).subscribe((res) => {
      this.loader.close();
      for (const k in res.classes) {
        for (const j in res.classes[k]) {
          const prop = k + '_' + j;
          this.formGroup.controls[prop].setValue(res.classes[k][j]);
        }
      }
    },
    (err) => {
      this.loader.close();
      new EntityUtils().handleWSError(this, err, this.dialog)
    });
  }

  onSubmit() {
    const payload = { classes: {} };

    for (const key in this.formGroup.value) {
      const key_values = key.split('_');
      const alert_class = key_values[0];
      const class_key = key_values[1];
      const def = _.find(this.defaults, {id: alert_class});
      if (def[class_key].toUpperCase() !== this.formGroup.value[key].toUpperCase()) { // do not submit defaults in the payload
        if(!payload.classes[alert_class]) {
          payload.classes[alert_class] = {};
        }
        payload.classes[alert_class][class_key] = this.formGroup.value[key];
      }
    }

    this.loader.open();

    this.ws.call(this.editCall, [payload])
      .subscribe(
        () => this.dialog.Info(T("Settings saved"), '', '300px', 'info', true),
        error => new EntityUtils().handleWSError(this, error, this.dialog)
      )
      .add(() => this.loader.close());
  }
}
