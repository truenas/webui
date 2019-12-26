import { Component, OnInit } from '@angular/core';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
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
 * This form is unlike most others which make use of EntityForm. This component's
 * form config is generated based on a response from the middleware.
 */
@Component({
  selector: 'app-system-alert',
  template: '<entity-form [conf]="this"></entity-form>',
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
  private entityForm: EntityFormComponent;

  constructor(
    private ws: WebSocketService,
    private entityFormService: EntityFormService,
    protected loader: AppLoaderService,
    public dialog: DialogService
  ) {}

  ngOnInit() {
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
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
  }

  /**
   * NOTE:
   * This method needs to be async to avoid a race condition. EntityForm
   * cannot handle dynamic FieldSets. Need to generate the FieldSets, then let EntityForm
   * do its thing.
   */
  async preInit(entityForm: EntityFormComponent) {
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
  }

  afterInit(entityForm: EntityFormComponent) {
    this.entityForm = entityForm;
    entityForm.submitFunction = this.customSubmit;
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    this.ws.call(this.queryCall).subscribe((res) => {
      for (const k in res.settings) {
        entityForm.formGroup.controls[k].setValue(res.settings[k]);
      }
    });
  }

  customSubmit() {
    const payload = {};

    for (const key in this.entityForm.formGroup.value) {
      payload[key] = { policy: this.entityForm.formGroup.value[key] };
    }
    // this.loader.open();

    return this.ws.call(this.editCall, [payload]);
    
    // .subscribe(
    //   (res) => {
    //     this.loader.close();
    //     this.dialog.Info(T("Settings saved"), '', '300px', 'info', true)
    //   },
    //   (res) => {
    //     this.loader.close();
    //     new EntityUtils().handleError(this, res);
    //   });
  }

}
