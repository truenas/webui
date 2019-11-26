import { ApplicationRef, Component, OnInit, Injector, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { RestService, WebSocketService, DialogService } from '../../../services/';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';
import { T } from '../../../translate-marker';
import { FormGroup } from '@angular/forms';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../common/entity/utils';

@Component({
  selector: 'app-system-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['../../common/entity/entity-form/entity-form.component.scss'],
  providers: [EntityFormService],
})

export class AlertConfigComponent implements OnInit {

  protected queryCall = 'alertdefaultsettings.config';
  protected editCall = 'alertdefaultsettings.update';
  protected isEntity = true;

  public fieldSets: FieldSet[];
  public fieldConfig: FieldConfig[] = [];
  protected settingOptions: any = [];
  public formGroup: any;
  public settingFormGroup: any;
  public isReady: boolean = false;
  public isFooterConsoleOpen: boolean;

  constructor(private rest: RestService, private ws: WebSocketService,
    private entityFormService: EntityFormService,
    protected loader: AppLoaderService, public dialog: DialogService) {}

  ngOnInit() {
    this.fieldSets = [{
        name: 'FallBack',
        class: 'fallback',
        width: '100%',
        divider: false,
        config: this.fieldConfig
      },
      {
        name: 'divider',
        divider: true,
        width: '100%'
      }
    ];

    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    this.ws.call('alert.list_policies', []).subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        this.settingOptions.push({ label: res[i], value: res[i] });
      }
    });
    this.ws.call('alert.list_sources', []).subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        this.fieldConfig.push({
          type: 'select',
          name: res[i].name,
          placeholder: T(res[i].title),
          options: this.settingOptions,
          value: 'IMMEDIATELY',
        });
      }
      this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
      this.ws.call(this.queryCall, []).subscribe((res) => {
        for (const k in res.settings) {
          this.formGroup.controls[k].setValue(res.settings[k]);
        }
      });
    });

    this.ws.call('system.advanced.config').subscribe((res)=> {
      if (res) {
        this.isFooterConsoleOpen = res.consolemsg;
      }
    });

  }

  onSubmit(event: Event) {
    let payload = {};
    let settingValue = _.cloneDeep(this.formGroup.value);

    payload['settings'] = settingValue;

    this.loader.open();

    this.ws.call(this.editCall, [payload]).subscribe(
      (res) => {
        this.loader.close();
        this.dialog.Info(T("Settings saved"), '', '300px', 'info', true)
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleError(this, res);
      });

  }

}
