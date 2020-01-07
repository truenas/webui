import { Component, OnInit } from '@angular/core';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { T } from 'app/translate-marker';
import { DialogService, WebSocketService } from '../../../services/';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';

interface AlertCategory {
  id: string;
  title: string;
  classes: {
    id: string;
    title: string;
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
  protected queryCall = 'alertdefaultsettings.config';
  protected editCall = 'alertclasses.update';
  protected isEntity = true;
  public fieldSets: FieldSets;
  public fieldConfig: FieldConfig[] = [];
  protected settingOptions: any = [];
  public formGroup: any;
  public settingFormGroup: any;
  public isReady = false;
  public isFooterConsoleOpen: boolean;

  constructor(
    private ws: WebSocketService,
    private entityFormService: EntityFormService,
    protected loader: AppLoaderService,
    public dialog: DialogService
  ) {}

  async ngOnInit() {
    this.ws.call('alert.list_policies', []).subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        this.settingOptions.push({ label: res[i], value: res[i] });
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
      /* Add spacer between sets in same row */
      if (index + 1 > 1 && (index + 1 % 2) !== 0) {
        sets.push({ name: "spacer", width: "2%", label: false });
      }

      sets.push({
        name: category.title,
        label: true,
        width: "49%",
        config: category.classes.map(c => ({
          type: "select",
          name: c.id,
          placeholder: c.title,
          options: this.settingOptions,
          value: "IMMEDIATELY"
        }))
      });
    });

    /**
     * If list length is odd, add large spacer to the end to keep all sections
     * the same width.
     */
    if (categories.length % 2 !== 0) {
      sets.push({ name: 'spacer', width: '51%', label: false });
    }

    /* Final divider before action buttons */
    sets.push({ name: 'divider', divider: true });

    this.fieldSets = new FieldSets(sets);

    this.fieldConfig = this.fieldSets.configs();
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
  
    this.ws.call(this.queryCall).subscribe((res) => {
      for (const k in res.settings) {
        this.formGroup.controls[k].setValue(res.settings[k]);
      }
    });
  }

  onSubmit() {
    const payload = { classes: {} };

    for (const key in this.formGroup.value) {
      payload.classes[key] = { policy: this.formGroup.value[key] };
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
