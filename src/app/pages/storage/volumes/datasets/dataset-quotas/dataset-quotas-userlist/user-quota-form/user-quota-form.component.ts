import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { EntityFormComponent } from '../../../../../../common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { DialogService, StorageService, WebSocketService, AppLoaderService, UserService } from 'app/services';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-quotas';

@Component({
  selector: 'app-user-quota-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class UserQuotaFormComponent {
  public isEntity = true;
  public entityForm: any;
  public pk: string;
  protected route_success: string[];
  public selectedEntries = [];
  public entryField;
  private isNew = true;
  private searchedEntries: any;
  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: helptext.users.quota_title,
      label: true,
      width: '48%',
      config: [
        {
          type: 'input',
          name: 'data_quota',
          placeholder: helptext.users.data_quota.placeholder,
          tooltip: helptext.users.data_quota.tooltip,
          value: 0,
          blurStatus: true,
          blurEvent: this.blurEvent,
          parent: this,
        },
        {
          type: 'input',
          name: 'obj_quota',
          placeholder: helptext.users.obj_quota.placeholder,
          tooltip: helptext.users.obj_quota.tooltip,
          value: 0
        }
      ]
    },
    {
      name: 'vertical_divider',
      label: false,
      width: '2%',
      config: []
    },
    {
      name: helptext.users.user_title,
      label: true,
      width: '48%',
      config: [
        {
          type: 'select',
          name: 'system_entries',
          placeholder: helptext.users.system_select.placeholder,
          tooltip: helptext.users.system_select.tooltip,
          multiple: true,
          options: [],
        },
        {
          type: 'chip',
          name: 'searched_entries',
          placeholder: helptext.users.search.placeholder,
          tooltip: helptext.users.search.tooltip,
          value: this.selectedEntries,
          id: 'selected-entries_chiplist',
          hasErrors: false,
          autocomplete: true,
          searchOptions: [],
          parent: this,
          updater: this.updateSearchOptions,
        }
      ]
    },
    {
      name: 'divider',
      divider: true
    }
  ];

  constructor(protected ws: WebSocketService, protected storageService: StorageService,
    protected aroute: ActivatedRoute, protected loader: AppLoaderService,
    protected router: Router, protected userService: UserService, private dialog: DialogService) { }

  preInit(entityForm: EntityFormComponent) {
    const paramMap: any = (<any>this.aroute.params).getValue();
    this.pk = paramMap.pk;
  }

  async validateEntry(value) {
    const validEntry = await this.userService.getUserObject(value);
    const chips = document.getElementsByTagName('mat-chip');
    if (!validEntry) {
      chips.item(chips.length-1).classList.add('chip-warn');
    }
    const errs = document.getElementsByClassName('chip-warn');
    errs.length > 0 ? this.searchedEntries.hasErrors = true : this.searchedEntries.hasErrors = false;
    console.log(this.searchedEntries)
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.route_success = ['storage', 'pools', 'user-quotas', this.pk];
    const entries = _.find(this.fieldConfig, {name: "system_entries"});
    this.searchedEntries = _.find(this.fieldConfig, {name: "searched_entries"});
    this.entryField = _.find(this.fieldSets.find(set => set.name === helptext.users.user_title).config,
      { 'name': 'searched_entries' });

    this.ws.call('user.query').subscribe(res => {
      res.map(entry => {
        entries.options.push({label: entry.username, value: entry.uid})
      });
    });

    this.entityForm.formGroup.controls['searched_entries'].valueChanges.subscribe(value => {
      if (value) {
        this.validateEntry(value[value.length - 1])
      }
    })

    entityEdit.formGroup.controls['data_quota'].valueChanges.subscribe((value) => {
      const formField = _.find(this.fieldConfig, { name: 'data_quota' });
      const filteredValue = value ? this.storageService.convertHumanStringToNum(value, false, 'kmgtp') : undefined;
      formField['hasErrors'] = false;
      formField['errors'] = '';
      if (filteredValue !== undefined && isNaN(filteredValue)) {
        formField['hasErrors'] = true;
        formField['errors'] = helptext.shared.input_error;
      };
    })
  }

  blurEvent(parent) {
    if (parent.entityForm && parent.storageService.humanReadable) {
      parent.transformValue(parent, 'data_quota');
    }
  }

  transformValue(parent, fieldname: string) {
    parent.entityForm.formGroup.controls[fieldname].setValue(parent.storageService.humanReadable || 0);
    parent.storageService.humanReadable = '';
  }

  updateSearchOptions(value = "", parent) {
    parent.userService.userQueryDSCache(value).subscribe(items => {
      const entries = [];
      for (let i = 0; i < items.length; i++) {
        entries.push({ label: items[i].username, value: items[i].username });
      }
      parent.entryField.searchOptions = entries;
    });
  }

  customSubmit(data) {
    const payload = [];
    if (!data.system_entries) {
      data.system_entries = [];
    }
    if (data.searched_entries.length > 0) {
      data.searched_entries.forEach(entry => {
        if (!data.system_entries.includes(entry)) {
          data.system_entries.push(entry)
        }
      })
    }

    if (data.system_entries) {
      data.system_entries.forEach((entry) => {
        payload.push({
          quota_type: 'USER',
          id: entry.toString(),
          quota_value: this.storageService.convertHumanStringToNum(data.data_quota)
        },
        {
          quota_type: 'USEROBJ',
          id: entry.toString(),
          quota_value: parseInt(data.obj_quota, 10)
        })
      });
    }

    this.loader.open();
    this.ws.call('pool.dataset.set_quota', [this.pk, payload]).subscribe(res => {
      this.loader.close();
      this.router.navigate(new Array('/').concat(this.route_success));
    }, err => {
      this.loader.close();
      this.dialog.errorReport('Error', err.reason, err.trace.formatted)
    })
  }
}
