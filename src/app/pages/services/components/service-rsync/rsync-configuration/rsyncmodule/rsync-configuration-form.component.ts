import { Component } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { ExplorerType } from 'app/enums/explorer-type.enum';
import { RsyncModuleMode } from 'app/enums/rsync-mode.enum';
import helptext from 'app/helptext/services/components/service-rsync';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { RsyncModule, RsyncModuleCreate } from 'app/interfaces/rsync-module.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormComboboxConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { UserService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-rsync-configuration-form',
  template: '<entity-form [conf]="this"></entity-form>',
})

export class RYSNCConfigurationFormComponent implements FormConfiguration {
  queryCall = 'rsyncmod.query' as const;
  route_success: string[] = ['services', 'rsync', 'rsync-module'];
  isEntity = true;
  formGroup: FormGroup;
  pk: number;
  title = helptext.moduleFormTitle;
  addCall = 'rsyncmod.create' as const;
  isNew: boolean;
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.rsyncd_fieldset_general,
      label: true,
      width: '49%',
      config: [{
        type: 'input',
        name: 'name',
        placeholder: helptext.rsyncmod_name_placeholder,
        tooltip: helptext.rsyncmod_name_tooltip,
        validation: Validators.required,
        required: true,
      }, {
        type: 'explorer',
        initial: '/mnt',
        explorerType: ExplorerType.Directory,
        placeholder: helptext.rsyncmod_path_placeholder,
        name: 'path',
        tooltip: helptext.rsyncmod_path_tooltip,
        validation: helptext.rsyncmod_path_validation,
        required: true,
      }, {
        type: 'input',
        name: 'comment',
        placeholder: helptext.rsyncmod_comment_placeholder,
        tooltip: helptext.rsyncmod_comment_tooltip,
      }, {
        type: 'checkbox',
        name: 'enabled',
        placeholder: helptext.rsyncmod_enabled_placeholder,
        tooltip: helptext.rsyncmod_enabled_tooltip,
      }],
    },
    { name: 'spacer', label: false, width: '2%' },
    {
      name: helptext.rsyncd_fieldset_access,
      label: true,
      width: '49%',
      config: [
        {
          type: 'select',
          name: 'mode',
          placeholder: helptext.rsyncmod_mode_placeholder,
          options: helptext.rsyncmod_mode_options,
          tooltip: helptext.rsyncmod_mode_tooltip,
          required: true,
        },
        {
          type: 'input',
          name: 'maxconn',
          placeholder: helptext.rsyncmod_maxconn_placeholder,
          inputType: 'number',
          value: 0,
          validation: helptext.rsyncmod_maxconn_validation,
          tooltip: helptext.rsyncmod_maxconn_tooltip,
        },
        {
          type: 'combobox',
          name: 'user',
          placeholder: helptext.rsyncmod_user_placeholder,
          tooltip: helptext.rsyncmod_user_tooltip,
          options: [],
          searchOptions: [],
          parent: this,
          updater: (value: string) => this.updateUserSearchOptions(value),
        },
        {
          type: 'combobox',
          name: 'group',
          placeholder: helptext.rsyncmod_group_placeholder,
          tooltip: helptext.rsyncmod_group_tooltip,
          options: [],
          searchOptions: [],
          parent: this,
          updater: (value: string) => this.updateGroupSearchOptions(value),
        },
        {
          type: 'chip',
          name: 'hostsallow',
          placeholder: helptext.rsyncmod_hostsallow_placeholder,
          tooltip: helptext.rsyncmod_hostsallow_tooltip,
        },
        {
          type: 'chip',
          name: 'hostsdeny',
          placeholder: helptext.rsyncmod_hostsdeny_placeholder,
          tooltip: helptext.rsyncmod_hostsdeny_tooltip,
        },
      ],
    },
    { name: 'divider', divider: true },
    {
      name: helptext.rsyncd_fieldset_other,
      label: true,
      config: [
        {
          type: 'textarea',
          name: 'auxiliary',
          placeholder: helptext.rsyncd_auxiliary_placeholder,
          tooltip: helptext.rsyncd_auxiliary_tooltip,
          value: '',
        },
      ],
    },
    { name: 'divider', divider: true },
  ];

  private rsyncmod_group: FormComboboxConfig;
  private rsyncmod_user: FormComboboxConfig;
  protected entityForm: EntityFormComponent;
  constructor(protected ws: WebSocketService, protected router: Router,
    protected userService: UserService, protected route: ActivatedRoute) {
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.isNew = entityForm.isNew;

    const accessSet = _.find(this.fieldSets, { name: helptext.rsyncd_fieldset_access });

    this.rsyncmod_user = accessSet.config.find((config) => config.name === 'user') as FormComboboxConfig;
    this.userService.userQueryDsCache().pipe(untilDestroyed(this)).subscribe((users) => {
      users.forEach((user) => {
        this.rsyncmod_user.options.push({ label: user.username, value: user.username });
      });
    });

    this.rsyncmod_group = accessSet.config.find((config) => config.name === 'group') as FormComboboxConfig;
    this.userService.groupQueryDsCache().pipe(untilDestroyed(this)).subscribe((groups) => {
      groups.forEach((group) => {
        this.rsyncmod_group.options.push({ label: group.group, value: group.group });
      });
    });

    if (this.isNew) {
      entityForm.formGroup.controls['mode'].setValue(RsyncModuleMode.ReadOnly);
    }

    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      if (params['pk']) {
        this.pk = parseInt(params['pk'], 10);
        this.ws.call('rsyncmod.query', [
          [
            ['id', '=', this.pk],
          ],
        ]).pipe(untilDestroyed(this)).subscribe((res) => {
          for (const i in res[0]) {
            if (i !== 'id') {
              entityForm.formGroup.controls[i].setValue(res[0][i as keyof RsyncModule]);
            }
          }
        });
      }
    });

    if (!this.isNew) {
      entityForm.submitFunction = this.submitFunction;
    }
  }

  updateGroupSearchOptions(value = ''): void {
    this.userService.groupQueryDsCache(value).pipe(untilDestroyed(this)).subscribe((groups) => {
      this.rsyncmod_group.searchOptions = groups.map((group) => {
        return { label: group.group, value: group.group };
      });
    });
  }

  updateUserSearchOptions(value = ''): void {
    this.userService.userQueryDsCache(value).pipe(untilDestroyed(this)).subscribe((items) => {
      this.rsyncmod_user.searchOptions = items.map((user) => {
        return { label: user.username, value: user.username };
      });
    });
  }

  submitFunction(formData: RsyncModuleCreate): Observable<RsyncModule> {
    return this.ws.call('rsyncmod.update', [this.pk, formData]);
  }
}
