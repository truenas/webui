import { Component, IterableDiffers } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { DialogService, StorageService, WebSocketService, AppLoaderService, UserService } from 'app/services';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-quotas';

@Component({
  selector: 'app-group-quota-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class GroupQuotaFormComponent {
  public isEntity = true;
  public entityForm: any;
  public pk: string;
  protected route_success: string[];
  public searchedEntries = [];
  public entryField;
  private isNew = true;
  private dq: string;
  private oq: string;
  private selectedEntriesField: any
  private selectedEntriesValue: any;
  private entryErrs: any;
  private entryErrBool = false;
  public save_button_enabled = false;
  private differ: any;
  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: helptext.groups.quota_title,
      label: true,
      width: '48%',
      config: [
        {
          type: 'input',
          name: 'data_quota',
          placeholder: helptext.groups.data_quota.placeholder,
          tooltip: `${helptext.groups.data_quota.tooltip} bytes.`,
          blurStatus: true,
          blurEvent: this.blurEvent,
          parent: this,
        },
        {
          type: 'input',
          name: 'obj_quota',
          placeholder: helptext.groups.obj_quota.placeholder,
          tooltip: helptext.groups.obj_quota.tooltip,
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
      name: helptext.groups.group_title,
      label: true,
      width: '48%',
      config: [
        {
          type: 'select',
          name: 'system_entries',
          placeholder: helptext.groups.system_select.placeholder,
          tooltip: helptext.groups.system_select.tooltip,
          multiple: true,
          options: [],
        },
        {
          type: 'chip',
          name: 'searched_entries',
          placeholder: helptext.groups.search.placeholder,
          tooltip: helptext.groups.search.tooltip,
          value: this.searchedEntries,
          id: 'selected-entries_chiplist',
          autocomplete: true,
          searchOptions: [],
          parent: this,
          updater: this.updateSearchOptions
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
    protected router: Router, protected userService: UserService, private dialog: DialogService,
    protected differs: IterableDiffers) {
      this.differ = differs.find([]).create(null);
  }

  preInit(entityForm: EntityFormComponent) {
    const paramMap: any = (<any>this.aroute.params).getValue();
    this.pk = paramMap.pk;
  }

  async validateEntry(value) {
    const validEntry = await this.userService.getGroupObject(value);
    if (!validEntry) {
      const chips = document.getElementsByTagName('mat-chip');
      chips.item(chips.length-1).classList.add('chip-warn');
    }
    this.entryErrs = document.getElementsByClassName('chip-warn');
    this.entryErrBool = this.entryErrs.length === 0 ? false : true;
    this.allowSubmit();
  }

  allowSubmit() {
    if ((this.dq || this.oq) &&
        (this.selectedEntriesValue.value && this.selectedEntriesValue.value.length > 0 ||
        this.searchedEntries && this.searchedEntries.length > 0) &&
        this.entryErrBool === false) {
      this.save_button_enabled = true;
    } else {
      this.save_button_enabled = false;
    }
  }

  // This is here because selecting an item from autocomplete doesn't trigger value change
  // Unsubscribes automatically
  ngDoCheck() {
    this.differ.diff(this.searchedEntries);
    if (this.searchedEntries.length > 0) {
      this.allowSubmit()
    }
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.route_success = ['storage', 'pools', 'group-quotas', this.pk];
    this.selectedEntriesField = _.find(this.fieldConfig, {name: "system_entries"});
    this.selectedEntriesValue = this.entityForm.formGroup.controls['system_entries'];
    this.entryField = _.find(this.fieldSets.find(set => set.name === helptext.groups.group_title).config,
      { 'name': 'searched_entries' });

    this.ws.call('group.query').subscribe(res => {
      res.map(entry => {
        this.selectedEntriesField.options.push({label: entry.group, value: entry.gid});
      });
    });

    this.entityForm.formGroup.controls['data_quota'].valueChanges.subscribe((res) => {
      this.dq = res;
      this.allowSubmit();
    })

    this.entityForm.formGroup.controls['obj_quota'].valueChanges.subscribe((res) => {
      this.oq = res;
      this.allowSubmit();
    })

    this.entityForm.formGroup.controls['system_entries'].valueChanges.subscribe(() => {
      this.allowSubmit();
    })

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
    parent.userService.groupQueryDSCache(value).subscribe(items => {
      const entries = [];
      for (let i = 0; i < items.length; i++) {
        entries.push({ label: items[i].group, value: items[i].group });
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
        if (data.data_quota) {
          const dq = this.storageService.convertHumanStringToNum(data.data_quota);
          if (dq >= 0) {
            payload.push({
              quota_type: 'GROUP',
              id: entry.toString(),
              quota_value: this.storageService.convertHumanStringToNum(data.data_quota)
            })
          }
        };
        if (data.obj_quota && data.obj_quota >= 0) {
          payload.push({
            quota_type: 'GROUPOBJ',
            id: entry.toString(),
            quota_value: parseInt(data.obj_quota, 10)
          })
        };
      })
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
