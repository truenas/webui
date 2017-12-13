import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { WebSocketService, RestService } from '../../../services/';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';

import { EntityFormComponent } from '../../common/entity/entity-form';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';

@Component({
  selector: 'direcotryservice-idmap',
  templateUrl: './idmap.component.html',
  providers: [EntityFormService]
})
export class IdmapComponent implements OnInit {

  protected query_call = "directoryservice.idmap_";
  public route_success: string[] = ['directoryservice'];

  public formGroup: any;
  public error: string;
  public busy: Subscription;
  public custActions: any;
  public pk: any;

  protected formFileds: FieldConfig[];
  public adFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'idmap_ad_range_low',
      placeholder: 'Range Low',
    },
    {
      type: 'input',
      name: 'idmap_ad_range_high',
      placeholder: 'Range High'
    },
    {
      type: 'select',
      name: 'idmap_ad_schema_mode',
      placeholder: 'Schema mode',
      options: [{
        label: 'rfc2307',
        value: 'rfc2307',
      }, {
        label: 'sfu',
        value: 'sfu',
      }, {
        label: 'sfu20',
        value: 'sfu20',
      }]
    }];
  public autoridFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'idmap_autorid_range_low',
      placeholder: 'Range Low',
    },
    {
      type: 'input',
      name: 'idmap_autorid_range_high',
      placeholder: 'Range High',
    },
    {
      type: 'input',
      name: 'idmap_autorid_rangesize',
      placeholder: 'Range Size',
    },
    {
      type: 'checkbox',
      name: 'idmap_autorid_readonly',
      placeholder: 'Read Only',
    },
    {
      type: 'checkbox',
      name: 'idmap_autorid_ignore_builtin',
      placeholder: 'Ignore Builtin',
    }];
  public fruitFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'idmap_fruit_range_low',
      placeholder: 'Range Low',
    },
    {
      type: 'input',
      name: 'idmap_fruit_range_high',
      placeholder: 'Range High'
    }];
  public ldapFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'idmap_ldap_range_low',
      placeholder: 'Range Low',
    },
    {
      type: 'input',
      name: 'idmap_ldap_range_high',
      placeholder: 'Range High'
    },
    {
      type: 'input',
      name: 'idmap_ldap_ldap_base_dn',
      placeholder: 'Base DN',
    },
    {
      type: 'input',
      name: 'idmap_ldap_ldap_user_dn',
      placeholder: 'User DN',
    },
    {
      type: 'input',
      name: 'idmap_ldap_ldap_url',
      placeholder: 'URL',
    },
    {
      type: 'select',
      name: 'idmap_ldap_ssl',
      placeholder: 'Encryption Mode',
      options: [{
        label: 'Off',
        value: 'off',
      }, {
        label: 'SSL',
        value: 'ssl',
      }, {
        label: 'TLS',
        value: 'tsl',
      }],
    },
    {
      type: 'select',
      name: '',
      placeholder: 'Certificate',
      options: [],
    }];
  public nssFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'idmap_nss_range_low',
      placeholder: 'Range Low',
    },
    {
      type: 'input',
      name: 'idmap_nss_range_high',
      placeholder: 'Range High'
    }];
  public rfcFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'idmap_rfc2307_range_low',
      placeholder: 'Range Low',
    },
    {
      type: 'input',
      name: 'idmap_rfc2307_range_high',
      placeholder: 'Range High'
    },
    {
      type: 'select',
      name: 'idmap_rfc2307_ldap_server',
      placeholder: 'LDAP Server',
      options: [],
    },
    {
      type: 'input',
      name: 'idmap_rfc2307_bind_path_user',
      placeholder: 'User Bind Path'
    },
    {
      type: 'input',
      name: 'idmap_rfc2307_bind_path_group',
      placeholder: 'Group Bind Path'
    },
    {
      type: 'checkbox',
      name: 'idmap_rfc2307_user_cn',
      placeholder: 'User CN'
    },
    {
      type: 'checkbox',
      name: 'idmap_rfc2307_cn_realm',
      placeholder: 'CN Realm'
    },
    {
      type: 'input',
      name: 'idmap_rfc2307_ldap_domain',
      placeholder: 'LDAP Domain'
    },
    {
      type: 'input',
      name: 'idmap_rfc2307_ldap_url',
      placeholder: 'LDAP URL'
    },
    {
      type: 'input',
      name: 'idmap_rfc2307_ldap_user_dn',
      placeholder: 'LDAP User DN'
    },
    {
      type: 'input',
      name: 'idmap_rfc2307_ldap_user_dn_password',
      placeholder: 'LDAP User DN Password'
    },
    {
      type: 'input',
      name: 'idmap_rfc2307_ldap_realm',
      placeholder: 'LDAP Realm'
    },
    {
      type: 'select',
      name: 'idmap_rfc2307_ssl',
      placeholder: 'Encryption Mode',
      options: [{
        label: 'Off',
        value: 'off',
      }, {
        label: 'SSL',
        value: 'ssl',
      }, {
        label: 'TLS',
        value: 'tsl',
      }],
    },
    {
      type: 'select',
      name: '',
      placeholder: 'Certificate',
      options: [],
    }];
  public ridFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'idmap_rid_range_low',
      placeholder: 'Range Low',
    },
    {
      type: 'input',
      name: 'idmap_rid_range_high',
      placeholder: 'Range High'
    }];
  public scriptFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'idmap_script_range_low',
      placeholder: 'Range Low',
    },
    {
      type: 'input',
      name: 'idmap_script_range_high',
      placeholder: 'Range High'
    },
    {
      type: 'input',
      name: 'idmap_script_script',
      placeholder: 'Script',
    }];
  public tdbFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'idmap_tdb_range_low',
      placeholder: 'Range Low',
    },
    {
      type: 'input',
      name: 'idmap_tdb_range_high',
      placeholder: 'Range High'
    }];
  public tdb2FieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'idmap_tdb2_range_low',
      placeholder: 'Range Low',
    },
    {
      type: 'input',
      name: 'idmap_tdb2_range_high',
      placeholder: 'Range High'
    },
    {
      type: 'input',
      name: 'idmap_tdb2_script',
      placeholder: 'Script',
    }];

  protected props: any;
  public step: any = 0;
  protected wsResponse: any;

  protected targetDS: any;
  protected idmap: any;
  public idmap_type: any;
  protected idmapID: any;
  protected defaultIdmap: any;
  constructor(protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected rest: RestService,
    protected entityFormService: EntityFormService,
    protected loader: AppLoaderService) {}

  ngOnInit() {
    this.aroute.params.subscribe((res) => {
      if (res['service']) {
        this.route_success.push(res['service']);
        if (res['service'] === 'activedirectory') {
          this.targetDS = 1;
        } else if (res['service'] === 'ldap') {
          this.targetDS = 2;
        }
      }
      if (res['pk']) {
        this.idmap_type = res['pk'];
      }
    });

    if (this.idmap_type === 'ad') {
      this.formGroup = this.entityFormService.createFormGroup(this.adFieldConfig);
    } else if (this.idmap_type === 'autorid') {
      this.formGroup = this.entityFormService.createFormGroup(this.autoridFieldConfig);
    } else if (this.idmap_type === 'fruit') {
      this.formGroup = this.entityFormService.createFormGroup(this.fruitFieldConfig);
    } else if (this.idmap_type === 'ldap') {
      this.formGroup = this.entityFormService.createFormGroup(this.ldapFieldConfig);
    } else if (this.idmap_type === 'nss') {
      this.formGroup = this.entityFormService.createFormGroup(this.nssFieldConfig);
    } else if (this.idmap_type === 'rfc2307') {
      this.formGroup = this.entityFormService.createFormGroup(this.rfcFieldConfig);
    } else if (this.idmap_type === 'rid') {
      this.formGroup = this.entityFormService.createFormGroup(this.ridFieldConfig);
    } else if (this.idmap_type === 'script') {
      this.formGroup = this.entityFormService.createFormGroup(this.scriptFieldConfig);
    } else if (this.idmap_type === 'tdb') {
      this.formGroup = this.entityFormService.createFormGroup(this.tdbFieldConfig);
    } else if (this.idmap_type === 'tdb2') {
      this.formGroup = this.entityFormService.createFormGroup(this.tdb2FieldConfig);
    }

    // get default idmap range
    this.rest.get('services/cifs', {}).subscribe((res) => {
      this.ws.call('datastore.query', ['directoryservice.idmap_tdb', [["idmap_ds_type", "=", "5"], ["idmap_ds_id", "=", res.data['id']]]]).subscribe((idmap_res) => {
        this.defaultIdmap = idmap_res[0];
      });
    });

    this.ws.call('datastore.query', [this.query_call + this.idmap_type, [["idmap_ds_type", "=", this.targetDS]]]).subscribe((res) => {
      if (res[0]) {
        this.idmapID = res[0]['id'];
        for (let i in res[0]) {
          if (this.formGroup.controls[i]) {
            this.formGroup.controls[i].setValue(res[0][i]);
          }
        }
      } else {
        // no idmap config find in datastore
        if (this.idmap_type === 'tdb' || this.idmap_type === 'tdb2' || this.idmap_type === 'script') {
          for (let i in this.formGroup.controls) {
            if(_.endsWith(i, 'range_low')) {
              this.formGroup.controls[i].setValue('90000001');
            } else if (_.endsWith(i, 'range_high')) {
              this.formGroup.controls[i].setValue('100000000');
            }
          }
        } else {
          for (let i in this.formGroup.controls) {
            if(_.endsWith(i, 'range_low')) {
              this.formGroup.controls[i].setValue('10000');
            } else if (_.endsWith(i, 'range_high')) {
              this.formGroup.controls[i].setValue('90000000');
            }
          }
        }
      }
    });

  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }

  onSubmit() {
    this.error = null;

    let value = _.cloneDeep(this.formGroup.value);
    let new_range_low: any;
    let new_range_high: any;

    for (let i in value) {
      if (_.endsWith(i, 'range_low')) {
        new_range_low = value[i];
      }
      if (_.endsWith(i, 'range_high')) {
        new_range_high = value[i];
      }
    }

    if (new_range_low > new_range_high) {
      this.error = "Range low larger than range high";
    } else {
      if (new_range_low < this.defaultIdmap['idmap_tdb_range_low'] || new_range_low > this.defaultIdmap['idmap_tdb_range_high']) {
        if (new_range_high < this.defaultIdmap['idmap_tdb_range_low'] || new_range_high > this.defaultIdmap['idmap_tdb_range_high']) {
          // no overlap, update/insert into datastore
          if (this.idmapID) {
            this.loader.open();
            this.ws.call('datastore.update', [this.query_call + this.idmap_type, this.idmapID, value]).subscribe(
              (res) => {
               this.loader.close();
               this.router.navigate(new Array('').concat(this.route_success));
              },
              (res) => {
                this.loader.close();
                console.log(res);
              }
            );
          } else {
            value['idmap_ds_type'] = this.targetDS;
            this.loader.open();
            this.ws.call('datastore.insert', [this.query_call + this.idmap_type, value]).subscribe(
              (res) => {
               this.loader.close();
               this.router.navigate(new Array('').concat(this.route_success));
              },
              (res) => {
                this.loader.close();
                console.log(res);
              }
            );
          }
        } else {
          this.error = "Range overlapped with the default range: [" + this.defaultIdmap['idmap_tdb_range_low'] + "," + this.defaultIdmap['idmap_tdb_range_high'] + "] !";
        }
      } else {
        this.error = "Range overlapped with the default range: [" + this.defaultIdmap['idmap_tdb_range_low'] + "," + this.defaultIdmap['idmap_tdb_range_high'] + "] !";
      }
    }
  }

}
