import { ApplicationRef, Component, Injector } from '@angular/core';
import { ValidationErrors, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { ProductType } from 'app/enums/product-type.enum';
import global_helptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/services/components/service-smb';
import { Choices } from 'app/interfaces/choices.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Option } from 'app/interfaces/option.interface';
import { SmbConfig } from 'app/interfaces/smb-config.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormComboboxConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import {
  IdmapService, ServicesService, UserService, WebSocketService,
} from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';

@UntilDestroy()
@Component({
  selector: 'smb-edit',
  template: ' <entity-form [conf]="this"></entity-form>',
  providers: [ServicesService, IdmapService],
})

export class ServiceSMBComponent implements FormConfiguration {
  queryCall: 'smb.config' = 'smb.config';
  route_success: string[] = ['services'];
  error: string;
  protected idmap_type = 'tdb';
  protected targetDS = '5';
  isBasicMode = true;

  private cifs_srv_bindip: FormSelectConfig;
  private cifs_srv_guest: FormSelectConfig;
  private cifs_srv_unixcharset: FormSelectConfig;
  private cifs_srv_admin_group: FormComboboxConfig;
  entityEdit: EntityFormComponent;
  private validBindIps: Choices;
  title = helptext.formTitle;

  advanced_field = [
    'unixcharset',
    'loglevel',
    'syslog',
    'localmaster',
    'guest',
    'filemask',
    'dirmask',
    'admin_group',
    'bindip',
    'smb_options',
    'aapl_extensions',
  ];
  protected hiddenFieldSets = [helptext.cifs_srv_fieldset_other];

  fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [
    {
      name: helptext.cifs_srv_fieldset_netbios,
      label: true,
      config: [
        {
          type: 'input',
          name: 'netbiosname',
          placeholder: helptext.cifs_srv_netbiosname_placeholder,
          tooltip: helptext.cifs_srv_netbiosname_tooltip,
          required: true,
          validation: helptext.cifs_srv_netbiosname_validation,
        },
        {
          type: 'input',
          name: 'netbiosname_b',
          placeholder: helptext.cifs_srv_netbiosname_b_placeholder,
          tooltip: helptext.cifs_srv_netbiosname_b_tooltip,
          validation: helptext.cifs_srv_netbiosname_b_validation,
          required: true,
          isHidden: true,
          disabled: true,
        },
        {
          type: 'chip',
          name: 'netbiosalias',
          placeholder: helptext.cifs_srv_netbiosalias_placeholder,
          tooltip: helptext.cifs_srv_netbiosalias_tooltip,
          validation: [
            (control: FormControl): ValidationErrors => {
              const config = this.fieldConfig.find((c) => c.name === 'netbiosalias');
              const aliasArr: string[] = control.value ? control.value : [];
              let counter = 0;
              aliasArr.forEach((alias) => {
                if (alias.length > 15) {
                  counter++;
                }
              });
              const errors = control.value && counter > 0
                ? { error: true }
                : null;

              if (errors) {
                config.hasErrors = true;
                config.errors = helptext.cifs_srv_netbiosalias_errmsg;
              } else {
                config.hasErrors = false;
                config.errors = '';
              }

              return errors;
            },
          ],
        },
        {
          type: 'input',
          name: 'workgroup',
          placeholder: helptext.cifs_srv_workgroup_placeholder,
          tooltip: helptext.cifs_srv_workgroup_tooltip,
          required: true,
          validation: helptext.cifs_srv_workgroup_validation,
        },
        {
          type: 'input',
          name: 'description',
          placeholder: helptext.cifs_srv_description_placeholder,
          tooltip: helptext.cifs_srv_description_tooltip,
        },
        {
          type: 'checkbox',
          name: 'enable_smb1',
          placeholder: helptext.cifs_srv_enable_smb1_placeholder,
          tooltip: helptext.cifs_srv_enable_smb1_tooltip,
        },
        {
          type: 'checkbox',
          name: 'ntlmv1_auth',
          placeholder: helptext.cifs_srv_ntlmv1_auth_placeholder,
          tooltip: helptext.cifs_srv_ntlmv1_auth_tooltip,
        },
      ],
    },

    { name: 'divider', divider: false },

    {
      name: helptext.cifs_srv_fieldset_other,
      label: false,
      width: '49%',
      config: [
        {
          type: 'select',
          name: 'unixcharset',
          placeholder: helptext.cifs_srv_unixcharset_placeholder,
          tooltip: helptext.cifs_srv_unixcharset_tooltip,
          options: [],
        },
        {
          type: 'select',
          name: 'loglevel',
          placeholder: helptext.cifs_srv_loglevel_placeholder,
          tooltip: helptext.cifs_srv_loglevel_tooltip,
          options: helptext.cifs_srv_loglevel_options,
          alert: {
            message: 'Higher log levels are for debuging purposes only and should not be set on production servers. Setting a log level too high may significantly impact SMB server performance and mask errors (because the log file will roll over too quickly).',
            forValues: ['FULL', 'DEBUG'],
          },
        },
        {
          type: 'checkbox',
          name: 'syslog',
          placeholder: helptext.cifs_srv_syslog_placeholder,
          tooltip: helptext.cifs_srv_syslog_tooltip,
        },
        {
          type: 'checkbox',
          name: 'localmaster',
          placeholder: helptext.cifs_srv_localmaster_placeholder,
          tooltip: helptext.cifs_srv_localmaster_tooltip,
        },
        {
          type: 'checkbox',
          name: 'aapl_extensions',
          placeholder: helptext.cifs_srv_aapl_extensions_placeholder,
          tooltip: helptext.cifs_srv_aapl_extensions_tooltip,
        },
        {
          type: 'combobox',
          name: 'admin_group',
          placeholder: helptext.cifs_srv_admin_group_placeholder,
          tooltip: helptext.cifs_srv_admin_group_tooltip,
          options: [],
          searchOptions: [],
          parent: this,
          updater: this.updateGroupSearchOptions,
        },
      ],
    },
    { name: 'vertical-spacer', width: '2%' },
    {
      name: 'otherColTwo',
      label: false,
      width: '49%',
      config: [
        {
          type: 'select',
          name: 'guest',
          placeholder: helptext.cifs_srv_guest_placeholder,
          options: [],
          tooltip: helptext.cifs_srv_guest_tooltip,
        },
        {
          type: 'input',
          name: 'filemask',
          placeholder: helptext.cifs_srv_filemask_placeholder,
          tooltip: helptext.cifs_srv_filemask_tooltip,
        },
        {
          type: 'input',
          name: 'dirmask',
          placeholder: helptext.cifs_srv_dirmask_placeholder,
          tooltip: helptext.cifs_srv_dirmask_tooltip,
        },
        {
          type: 'select',
          name: 'bindip',
          placeholder: helptext.cifs_srv_bindip_placeholder,
          tooltip: helptext.cifs_srv_bindip_tooltip,
          options: [],
          multiple: true,
        },
        {
          type: 'textarea',
          name: 'smb_options',
          placeholder: helptext.cifs_srv_smb_options_placeholder,
          tooltip: helptext.cifs_srv_smb_options_tooltip,
        },
      ],
    },
    { name: 'divider', divider: true },
  ];

  custActions = [
    {
      id: 'basic_mode',
      name: global_helptext.basic_options,
      function: () => {
        this.hiddenFieldSets.forEach((setId) => (this.fieldSets.find((set) => set.name === setId).label = false));
        this.fieldSets.filter((set) => set.name === 'divider')[0].divider = false;
        this.isBasicMode = !this.isBasicMode;
      },
    },
    {
      id: 'advanced_mode',
      name: global_helptext.advanced_options,
      function: () => {
        this.hiddenFieldSets.forEach((setId) => (this.fieldSets.find((set) => set.name === setId).label = true));
        this.fieldSets.filter((set) => set.name === 'divider').forEach((set) => set.divider = true);
        this.isBasicMode = !this.isBasicMode;
      },
    },
  ];

  isCustActionVisible(actionId: string): boolean {
    if (actionId === 'advanced_mode' && !this.isBasicMode) {
      return false;
    } if (actionId === 'basic_mode' && this.isBasicMode) {
      return false;
    }
    return true;
  }

  preInit(entityForm: EntityFormComponent): void {
    this.entityEdit = entityForm;
    if (window.localStorage.getItem('product_type').includes(ProductType.Enterprise)) {
      this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((is_ha) => {
        entityForm.setDisabled('netbiosname_b', !is_ha, !is_ha);
      });
    }

    const otherSet = _.find(this.fieldSets, { name: helptext.cifs_srv_fieldset_other });
    const otherColTwoSet = _.find(this.fieldSets, { name: 'otherColTwo' });

    this.cifs_srv_unixcharset = otherSet.config.find((config) => config.name === 'unixcharset') as FormSelectConfig;
    this.ws.call('smb.unixcharset_choices').pipe(untilDestroyed(this)).subscribe((res) => {
      const values = Object.values(res);
      values.forEach((charset) => {
        this.cifs_srv_unixcharset.options.push({ label: charset, value: charset });
      });
    });

    this.servicesService.getSmbBindIPChoices().pipe(untilDestroyed(this)).subscribe((res) => {
      this.validBindIps = res;
      this.cifs_srv_bindip = otherColTwoSet.config.find((config) => config.name === 'bindip') as FormSelectConfig;
      for (const key in res) {
        if (res.hasOwnProperty(key)) {
          this.cifs_srv_bindip.options.push({ label: res[key], value: res[key] });
        }
      }
    });

    this.ws.call('user.query').pipe(untilDestroyed(this)).subscribe((users) => {
      this.cifs_srv_guest = otherColTwoSet.config.find((config) => config.name === 'guest') as FormSelectConfig;
      users.forEach((user) => {
        this.cifs_srv_guest.options.push({ label: user.username, value: user.username });
      });
    });

    this.userService.groupQueryDSCache('', true).pipe(untilDestroyed(this)).subscribe((groups) => {
      const groupOptions: Option[] = [];
      groups.forEach((item) => {
        groupOptions.push({ label: item.group, value: item.group });
      });
      this.cifs_srv_admin_group = otherSet.config.find((config) => config.name === 'admin_group') as FormComboboxConfig;
      groupOptions.forEach((group) => {
        this.cifs_srv_admin_group.options.push({ label: group.label, value: group.value });
      });
    });
  }

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected servicesService: ServicesService,
    protected idmapService: IdmapService,
    protected userService: UserService,
    protected loader: AppLoaderService,
    protected dialog: MatDialog,
  ) {}

  resourceTransformIncomingRestData(data: SmbConfig): SmbConfig {
    // If validIps is slow to load, skip check on load (It's still done on save)
    if (this.validBindIps && Object.keys(this.validBindIps).length !== 0) {
      return this.compareBindIps(data);
    }
    return data;
  }

  compareBindIps(data: SmbConfig): SmbConfig {
    // Weeds out invalid addresses (ie, ones that have changed). Called on load and on save.
    data.bindip = data.bindip ? data.bindip : [];
    if (this.validBindIps && Object.keys(this.validBindIps).length !== 0) {
      data.bindip.forEach((ip) => {
        if (!Object.values(this.validBindIps).includes(ip)) {
          data.bindip.splice((data.bindip as any)[ip], 1);
        }
      });
    } else {
      data.bindip = [];
    }
    return data;
  }

  afterInit(entityEdit: EntityFormComponent): void {
    entityEdit.submitFunction = (body) => this.ws.call('smb.update', [body]);
  }

  updateGroupSearchOptions(value = '', parent: this): void {
    parent.userService.groupQueryDSCache(value, true).pipe(untilDestroyed(this)).subscribe((items) => {
      parent.cifs_srv_admin_group.searchOptions = items.map((group) => {
        return { label: group.group, value: group.group };
      });
    });
  }

  beforeSubmit(data: SmbConfig): void {
    this.compareBindIps(data);
  }
}
