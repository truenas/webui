import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { NfsSecurityProvider } from 'app/enums/nfs-security-provider.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import globalHelptext from 'app/helptext/global-helptext';
import { helptext_sharing_nfs, shared } from 'app/helptext/sharing';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Group } from 'app/interfaces/group.interface';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { Option } from 'app/interfaces/option.interface';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormComboboxConfig, FormListConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { ipv4or6cidrValidator } from 'app/pages/common/entity/entity-form/validators/ip-validation';
import {
  DialogService, NetworkService, WebSocketService, UserService, ModalService,
} from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-nfs-form',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [NetworkService],
})
export class NFSFormComponent implements FormConfiguration {
  queryCall: 'sharing.nfs.query' = 'sharing.nfs.query';
  editCall: 'sharing.nfs.update' = 'sharing.nfs.update';
  addCall: 'sharing.nfs.create' = 'sharing.nfs.create';
  pk: number;
  queryKey = 'id';
  isEntity = true;
  isBasicMode = true;
  entityForm: EntityFormComponent;
  save_button_enabled = true;
  productType = window.localStorage.getItem('product_type') as ProductType;
  hideOnScale = ['alldirs', 'quiet'];
  title = helptext_sharing_nfs.title;
  isOneColumnForm = true;

  fieldSets = new FieldSets([
    {
      name: helptext_sharing_nfs.fieldset_paths,
      label: true,
      config: [
        {
          type: 'list',
          name: 'paths',
          width: '100%',
          templateListField: [
            {
              name: 'path',
              placeholder: helptext_sharing_nfs.placeholder_path,
              tooltip: helptext_sharing_nfs.tooltip_path,
              type: 'explorer',
              explorerType: 'directory',
              initial: '/mnt',
              required: true,
              validation: helptext_sharing_nfs.validators_path,
            },
          ],
          listFields: [],
        },
      ],
    },
    { name: 'divider_general', divider: true },
    {
      name: helptext_sharing_nfs.fieldset_general,
      class: 'general',
      label: true,
      config: [
        {
          type: 'input',
          name: 'comment',
          placeholder: helptext_sharing_nfs.placeholder_comment,
          tooltip: helptext_sharing_nfs.tooltip_comment,
        },
        {
          type: 'checkbox',
          name: 'alldirs',
          placeholder: helptext_sharing_nfs.placeholder_alldirs,
          tooltip: helptext_sharing_nfs.tooltip_alldirs,
        },
        {
          type: 'checkbox',
          name: 'quiet',
          placeholder: helptext_sharing_nfs.placeholder_quiet,
          tooltip: helptext_sharing_nfs.tooltip_quiet,
        },
        {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptext_sharing_nfs.placeholder_enabled,
          tooltip: helptext_sharing_nfs.tooltip_enabled,
          value: true,
        },
      ],
    },
    {
      name: helptext_sharing_nfs.fieldset_access,
      label: false,
      class: 'access',
      config: [
        {
          type: 'checkbox',
          name: 'ro',
          placeholder: helptext_sharing_nfs.placeholder_ro,
          tooltip: helptext_sharing_nfs.tooltip_ro,
        },
        {
          type: 'combobox',
          name: 'maproot_user',
          placeholder: helptext_sharing_nfs.placeholder_maproot_user,
          tooltip: helptext_sharing_nfs.tooltip_maproot_user,
          options: [],
          value: '',
          searchOptions: [],
          parent: this,
          updateLocal: true,
          updater: this.updateMapRootUserSearchOptions,
          loadMoreOptions: this.loadMoreUserOptions,
        },
        {
          type: 'combobox',
          name: 'maproot_group',
          placeholder: helptext_sharing_nfs.placeholder_maproot_group,
          tooltip: helptext_sharing_nfs.tooltip_maproot_group,
          options: [],
          value: '',
          searchOptions: [],
          parent: this,
          updateLocal: true,
          updater: this.updateMapRootGroupSearchOptions,
          loadMoreOptions: this.loadMoreGroupOptions,
        },
        {
          type: 'combobox',
          name: 'mapall_user',
          placeholder: helptext_sharing_nfs.placeholder_mapall_user,
          tooltip: helptext_sharing_nfs.tooltip_mapall_user,
          options: [],
          value: '',
          searchOptions: [],
          parent: this,
          updateLocal: true,
          updater: this.updateMapAllUserSearchOptions,
          loadMoreOptions: this.loadMoreUserOptions,
        },
        {
          type: 'combobox',
          name: 'mapall_group',
          placeholder: helptext_sharing_nfs.placeholder_mapall_group,
          tooltip: helptext_sharing_nfs.tooltip_mapall_group,
          options: [],
          value: '',
          searchOptions: [],
          parent: this,
          updateLocal: true,
          updater: this.updateMapAllGroupSearchOptions,
          loadMoreOptions: this.loadMoreGroupOptions,
        },
        {
          type: 'select',
          multiple: true,
          name: 'security',
          placeholder: helptext_sharing_nfs.placeholder_security,
          options: [
            {
              label: 'SYS',
              value: NfsSecurityProvider.Sys,
            },
            {
              label: 'KRB5',
              value: NfsSecurityProvider.Krb5,
            },
            {
              label: 'KRB5I',
              value: NfsSecurityProvider.Krb5i,
            },
            {
              label: 'KRB5P',
              value: NfsSecurityProvider.Krb5p,
            },
          ],
          isHidden: false,
          value: [],
        },
      ],
    },
    {
      name: helptext_sharing_nfs.fieldset_networks,
      label: false,
      class: 'networks',
      config: [
        {
          type: 'list',
          name: 'networks',
          templateListField: [
            {
              type: 'ipwithnetmask',
              name: 'network',
              placeholder: helptext_sharing_nfs.placeholder_network,
              tooltip: helptext_sharing_nfs.tooltip_network,
              validation: [ipv4or6cidrValidator()],
            },
          ],
          listFields: [],
        },
      ],
    },
    {
      name: helptext_sharing_nfs.fieldset_hosts,
      label: false,
      class: 'hosts',
      config: [
        {
          type: 'list',
          name: 'hosts',
          templateListField: [
            {
              type: 'input',
              name: 'host',
              placeholder: helptext_sharing_nfs.placeholder_hosts,
              tooltip: helptext_sharing_nfs.tooltip_hosts,
            },
          ],
          listFields: [],
        },
      ],
    },
    { name: 'divider', divider: true },
  ]);

  advanced_field = [
    'ro',
    'networks',
    'hosts',
    'maproot_user',
    'maproot_group',
    'mapall_user',
    'mapall_group',
    'security',
  ];

  protected advanced_sets = ['access', 'networks', 'hosts'];
  protected advanced_dividers = ['divider_access'];

  custActions = [
    {
      id: 'basic_mode',
      name: globalHelptext.basic_options,
      function: () => {
        this.isBasicMode = !this.isBasicMode;
        this.fieldSets.toggleSets(this.advanced_sets).toggleDividers(this.advanced_dividers);
      },
    },
    {
      id: 'advanced_mode',
      name: globalHelptext.advanced_options,
      function: () => {
        this.isBasicMode = !this.isBasicMode;
        this.fieldSets.toggleSets(this.advanced_sets).toggleDividers(this.advanced_dividers);
      },
    },
  ];

  private maproot_user: FormComboboxConfig;
  private maproot_group: FormComboboxConfig;
  private mapall_user: FormComboboxConfig;
  private mapall_group: FormComboboxConfig;

  constructor(
    protected userService: UserService,
    protected modalService: ModalService,
    protected ws: WebSocketService,
    private dialog: DialogService,
    public networkService: NetworkService,
    private translate: TranslateService,
  ) {
    const paths = this.fieldSets.config('paths') as FormListConfig;
    const pathsTemplate = paths.templateListField;
    if (this.productType.includes(ProductType.Scale)) {
      pathsTemplate.push({
        type: 'input',
        name: 'alias',
        placeholder: helptext_sharing_nfs.placeholder_alias,
        tooltip: helptext_sharing_nfs.tooltip_alias,
        validation: [Validators.pattern(/^\/.*/)],
      });
    }
  }

  preInit(): void {
    this.modalService.getRow$.pipe(untilDestroyed(this)).subscribe((id: number) => {
      this.pk = id;
    });

    this.ws
      .call('nfs.config')
      .pipe(untilDestroyed(this))
      .subscribe((nfsConfig) => {
        this.fieldSets.config('security').isHidden = !nfsConfig.v4;
      });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;

    this.title = entityForm.isNew ? helptext_sharing_nfs.title : helptext_sharing_nfs.editTitle;

    this.userService
      .userQueryDSCache()
      .pipe(untilDestroyed(this))
      .subscribe((items) => {
        const users = [
          {
            label: '---------',
            value: '',
          },
        ];
        items.forEach((user) => {
          users.push({ label: user.username, value: user.username });
        });
        this.mapall_user = this.fieldSets.config('mapall_user') as FormComboboxConfig;
        this.mapall_user.options = users;
        this.maproot_user = this.fieldSets.config('maproot_user') as FormComboboxConfig;
        this.maproot_user.options = users;
      });

    this.userService
      .groupQueryDSCache()
      .pipe(untilDestroyed(this))
      .subscribe((groups) => {
        const groupOptions: Option[] = [
          {
            label: '---------',
            value: '',
          },
        ];
        groups.forEach((group) => {
          groupOptions.push({ label: group.group, value: group.group });
        });
        this.mapall_group = this.fieldSets.config('mapall_group') as FormComboboxConfig;
        this.mapall_group.options = groupOptions;
        this.maproot_group = this.fieldSets.config('maproot_group') as FormComboboxConfig;
        this.maproot_group.options = groupOptions;
      });

    if (this.productType.includes(ProductType.Scale)) {
      this.hideOnScale.forEach((name) => {
        this.entityForm.setDisabled(name, true, true);
      });
    }

    entityForm.formGroup.controls['paths'].valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res: { alias: string; path: string }[]) => {
        const aliases = res.filter((p) => !!p.alias);

        if (aliases.length > 0 && aliases.length !== res.length) {
          this.fieldSets.config('paths').hasErrors = true;
          this.fieldSets.config('paths').errors = helptext_sharing_nfs.error_alias;
        } else {
          this.fieldSets.config('paths').hasErrors = false;
          this.fieldSets.config('paths').errors = '';
        }
      });
  }

  isCustActionVisible(actionId: string): boolean {
    if (actionId === 'advanced_mode' && !this.isBasicMode) {
      return false;
    }
    if (actionId === 'basic_mode' && this.isBasicMode) {
      return false;
    }
    return true;
  }

  resourceTransformIncomingRestData(data: NfsShare): any {
    const paths = [];
    for (let i = 0; i < data['paths'].length; i++) {
      paths.push({ path: data['paths'][i], alias: data['aliases'][i] ? data['aliases'][i] : undefined });
    }

    const networks = data.networks.map((network) => ({ network }));
    const hosts = data.hosts.map((host) => ({ host }));

    return {
      ...data,
      paths,
      networks,
      hosts,
    };
  }

  clean(data: any): any {
    return {
      ...data,
      paths: (data.paths as any[]).filter((p) => !!p.path).map((p) => p.path),
      aliases: (data.paths as any[]).filter((p) => !!p.alias).map((p) => p.alias),
      networks: (data.networks as any[]).filter((n) => !!n.network).map((n) => n.network),
      hosts: (data.hosts as any[]).filter((h) => !!h.host).map((h) => h.host),
    };
  }

  afterSave(): void {
    this.modalService.close('slide-in-form');
    this.modalService.refreshTable();
    this.ws
      .call('service.query', [[]])
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        const service = _.find(res, { service: ServiceName.Nfs });
        if (!service.enable) {
          this.dialog
            .confirm({
              title: shared.dialog_title,
              message: shared.dialog_message,
              hideCheckBox: true,
              buttonMsg: shared.dialog_button,
            })
            .pipe(untilDestroyed(this))
            .subscribe((dialogRes: boolean) => {
              if (dialogRes) {
                this.ws
                  .call('service.update', [service.id, { enable: true }])
                  .pipe(untilDestroyed(this))
                  .subscribe(
                    () => {
                      this.ws
                        .call('service.start', [service.service])
                        .pipe(untilDestroyed(this))
                        .subscribe(
                          () => {
                            this.dialog.info(
                              this.translate.instant('{service} Service', { service: 'NFS' }),
                              this.translate.instant('The {service} service has been enabled.', { service: 'NFS' }),
                              '250px',
                              'info',
                            )
                              .pipe(untilDestroyed(this))
                              .subscribe(() => {
                                this.dialog.closeAllDialogs();
                              });
                          },
                          (err) => {
                            this.dialog.errorReport(err.error, err.reason, err.trace.formatted);
                          },
                        );
                    },
                    (err) => {
                      this.dialog.errorReport(err.error, err.reason, err.trace.formatted);
                    },
                  );
              }
            });
        }
      });
  }

  updateMapAllGroupSearchOptions(value = '', parent: NFSFormComponent): void {
    parent.updateGroupSearchOptions(value, parent, 'mapall_group');
  }

  updateMapRootGroupSearchOptions(value = '', parent: NFSFormComponent): void {
    parent.updateGroupSearchOptions(value, parent, 'maproot_group');
  }

  updateGroupSearchOptions(value = '', parent: NFSFormComponent, field: string): void {
    parent.userService
      .groupQueryDSCache(value)
      .pipe(untilDestroyed(parent))
      .subscribe((groups) => {
        const config = parent.fieldSets.config(field) as FormComboboxConfig;
        config.searchOptions = groups.map((group) => ({ label: group.group, value: group.group }));
      });
  }

  updateMapAllUserSearchOptions(value = '', parent: NFSFormComponent): void {
    parent.updateUserSearchOptions(value, parent, 'mapall_user');
  }

  updateMapRootUserSearchOptions(value = '', parent: NFSFormComponent): void {
    parent.updateUserSearchOptions(value, parent, 'maproot_user');
  }

  updateUserSearchOptions(value = '', parent: NFSFormComponent, field: string): void {
    parent.userService
      .userQueryDSCache(value)
      .pipe(untilDestroyed(parent))
      .subscribe((users) => {
        const config = parent.fieldSets.config(field) as FormComboboxConfig;
        config.searchOptions = users.map((user) => ({ label: user.username, value: user.username }));
      });
  }

  loadMoreUserOptions(length: number, parent: NFSFormComponent, searchText: string, fieldConfig: FieldConfig): void {
    parent.userService
      .userQueryDSCache(searchText, length)
      .pipe(untilDestroyed(parent))
      .subscribe((items) => {
        const users = items.map((user) => ({ label: user.username, value: user.username }));

        const config = fieldConfig as FormComboboxConfig;

        if (searchText == '') {
          config.options = config.options.concat(users);
        } else {
          config.searchOptions = config.searchOptions.concat(users);
        }
      });
  }

  loadMoreGroupOptions(length: number, parent: NFSFormComponent, searchText: string, fieldConfig: FieldConfig): void {
    parent.userService
      .groupQueryDSCache(searchText, false, length)
      .pipe(untilDestroyed(parent))
      .subscribe((items: Group[]) => {
        const groups = items.map((group) => ({ label: group.group, value: group.group }));

        const config = fieldConfig as FormComboboxConfig;

        if (searchText == '') {
          config.options = config.options.concat(groups);
        } else {
          config.searchOptions = config.searchOptions.concat(groups);
        }
      });
  }
}
