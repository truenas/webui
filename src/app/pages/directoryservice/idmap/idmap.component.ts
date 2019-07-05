import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { WebSocketService, RestService } from '../../../services/';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';

import { EntityFormComponent } from '../../common/entity/entity-form';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';

import helptext from '../../../helptext/directoryservice/idmap';

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
      name: helptext.idmap_ad_range_low_name,
      placeholder: helptext.idmap_ad_range_low_placeholder,
      tooltip: helptext.idmap_ad_range_low_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_ad_range_high_name,
      placeholder: helptext.idmap_ad_range_high_placeholder,
      tooltip: helptext.idmap_ad_range_high_tooltip,
    },
    {
      type: 'select',
      name: helptext.idmap_ad_schema_mode_name,
      placeholder: helptext.idmap_ad_schema_mode_placeholder,
      tooltip: helptext.idmap_ad_schema_mode_tooltip,
      options: helptext.idmap_ad_schema_mode_options
    }];
  public autoridFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: helptext.idmap_autorid_range_low_name,
      placeholder: helptext.idmap_autorid_range_low_placeholder,
      tooltip: helptext.idmap_autorid_range_low_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_autorid_range_high_name,
      placeholder: helptext.idmap_autorid_range_high_placeholder,
      tooltip: helptext.idmap_autorid_range_high_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_autorid_rangesize_name,
      placeholder: helptext.idmap_autorid_rangesize_placeholder,
      tooltip: helptext.idmap_autorid_rangesize_tooltip,
    },
    {
      type: 'checkbox',
      name: helptext.idmap_autorid_readonly_name,
      placeholder: helptext.idmap_autorid_readonly_placeholder,
      tooltip: helptext.idmap_autorid_readonly_tooltip,
    },
    {
      type: 'checkbox',
      name: helptext.idmap_autorid_ignore_builtin_name,
      placeholder: helptext.idmap_autorid_ignore_builtin_placeholder,
      tooltip: helptext.idmap_autorid_ignore_builtin_tooltip,
    }];
  public fruitFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: helptext.idmap_fruit_range_low_name,
      placeholder: helptext.idmap_fruit_range_low_placeholder,
      tooltip: helptext.idmap_fruit_range_low_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_fruit_range_high_name,
      placeholder: helptext.idmap_fruit_range_high_placeholder,
      tooltip: helptext.idmap_fruit_range_high_tooltip,
    }];
  public ldapFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: helptext.idmap_ldap_range_low_name,
      placeholder: helptext.idmap_ldap_range_low_placeholder,
      tooltip: helptext.idmap_ldap_range_low_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_ldap_range_high_name,
      placeholder: helptext.idmap_ldap_range_high_placeholder,
      tooltip: helptext.idmap_ldap_range_high_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_ldap_basedn_name,
      placeholder: helptext.idmap_ldap_basedn_placeholder,
      tooltip: helptext.idmap_ldap_basedn_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_ldap_userdn_name,
      placeholder: helptext.idmap_ldap_userdn_placeholder,
      tooltip: helptext.idmap_ldap_userdn_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_ldap_url_name,
      placeholder: helptext.idmap_ldap_url_placeholder,
      tooltip: helptext.idmap_ldap_url_tooltip,
    },
    {
      type: 'select',
      name: helptext.idmap_ldap_ssl_name,
      placeholder: helptext.idmap_ldap_ssl_placeholder,
      tooltip: helptext.idmap_ldap_ssl_tooltip,
      options: helptext.idmap_ldap_ssl_options
    },
    {
      type: 'select',
      name: helptext.idmap_ldap_cert_name,
      placeholder: helptext.idmap_ldap_cert_placeholder,
      tooltip: helptext.idmap_ldap_cert_tooltip,
      options: [],
    }];
  public nssFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: helptext.idmap_nss_range_low_name,
      placeholder: helptext.idmap_nss_range_low_name,
      tooltip: helptext.idmap_nss_range_low_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_nss_range_high_name,
      placeholder: helptext.idmap_nss_range_high_placeholder,
      tooltip: helptext.idmap_nss_range_high_tooltip,
    }];
  public rfcFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: helptext.idmap_rfc2307_range_low_name,
      placeholder: helptext.idmap_rfc2307_range_low_placeholder,
      tooltip: helptext.idmap_rfc2307_range_low_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_rfc2307_range_high_name,
      placeholder: helptext.idmap_rfc2307_range_high_placeholder,
      tooltip: helptext.idmap_rfc2307_range_high_tooltip,
    },
    {
      type: 'select',
      name: helptext.idmap_rfc2307_ldap_server_name,
      placeholder: helptext.idmap_rfc2307_ldap_server_placeholder,
      tooltip: helptext.idmap_rfc2307_ldap_server_tooltip,
      options: [],
    },
    {
      type: 'input',
      name: helptext.idmap_rfc2307_bpuser_name,
      placeholder: helptext.idmap_rfc2307_bpuser_placeholder,
      tooltip: helptext.idmap_rfc2307_bpuser_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_rfc2307_bpgroup_name,
      placeholder: helptext.idmap_rfc2307_bpgroup_placeholder,
      tooltip: helptext.idmap_rfc2307_bpgroup_tooltip,
    },
    {
      type: 'checkbox',
      name: helptext.idmap_rfc2307_user_cn_name,
      placeholder: helptext.idmap_rfc2307_user_cn_placeholder,
      tooltip: helptext.idmap_rfc2307_user_cn_tooltip,
    },
    {
      type: 'checkbox',
      name: helptext.idmap_rfc2307_cn_realm_name,
      placeholder: helptext.idmap_rfc2307_cn_realm_placeholder,
      tooltip: helptext.idmap_rfc2307_cn_realm_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_rfc2307_ldap_domain_name,
      placeholder: helptext.idmap_rfc2307_ldap_domain_placeholder,
      tooltip: helptext.idmap_rfc2307_ldap_domain_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_rfc2307_ldap_url_name,
      placeholder: helptext.idmap_rfc2307_ldap_url_placeholder,
      tooltip: helptext.idmap_rfc2307_ldap_url_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_rfc2307_ldap_user_dn_name,
      placeholder: helptext.idmap_rfc2307_ldap_user_dn_placeholder,
      tooltip: helptext.idmap_rfc2307_ldap_user_dn_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_rfc2307_ldap_user_dn_pw_name,
      placeholder: helptext.idmap_rfc2307_ldap_user_dn_pw_placeholder,
      tooltip: helptext.idmap_rfc2307_ldap_user_dn_pw_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_rfc2307_ldap_realm_name,
      placeholder: helptext.idmap_rfc2307_ldap_realm_placeholder,
      tooltip: helptext.idmap_rfc2307_ldap_realm_tooltip,
    },
    {
      type: 'select',
      name: helptext.idmap_rfc2307_ssl_name,
      placeholder: helptext.idmap_rfc2307_ssl_placeholder,
      tooltip: helptext.idmap_rfc2307_ssl_tooltip,
      options: helptext.idmap_rfc2307_ssl_options
    },
    {
      type: 'select',
      name: helptext.idmap_rfc2307_cert_name,
      placeholder: helptext.idmap_rfc2307_cert_placeholder,
      tooltip: helptext.idmap_rfc2307_cert_tooltip,
      options: [],
    }];
  public ridFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: helptext.idmap_rid_range_low_name,
      placeholder: helptext.idmap_rid_range_low_placeholder,
      tooltip: helptext.idmap_rid_range_low_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_rid_range_high_name,
      placeholder: helptext.idmap_rid_range_high_placeholder,
      tooltip: helptext.idmap_rid_range_high_tooltip,
    }];
  public scriptFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: helptext.idmap_script_range_low_name,
      placeholder: helptext.idmap_script_range_low_placeholder,
      tooltip: helptext.idmap_script_range_low_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_script_range_high_name,
      placeholder: helptext.idmap_script_range_high_placeholder,
      tooltip: helptext.idmap_script_range_high_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_script_name,
      placeholder: helptext.idmap_script_placeholder,
      tooltip: helptext.idmap_script_tooltip,
    }];
  public tdbFieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: helptext.idmap_tdb_range_low_name,
      placeholder: helptext.idmap_tdb_range_low_placeholder,
      tooltip: helptext.idmap_tdb_range_low_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_tdb_range_high_name,
      placeholder: helptext.idmap_tdb_range_high_placeholder,
      tooltip: helptext.idmap_tdb_range_high_tooltip,
    }];
  public tdb2FieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: helptext.idmap_tdb2_range_low_name,
      placeholder: helptext.idmap_tdb2_range_low_placeholder,
      tooltip: helptext.idmap_tdb2_range_low_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_tdb2_range_high_name,
      placeholder: helptext.idmap_tdb2_range_high_placeholder,
      tooltip: helptext.idmap_tdb2_range_high_tooltip,
    },
    {
      type: 'input',
      name: helptext.idmap_tdb2_script_name,
      placeholder: helptext.idmap_tdb2_script_placeholder,
      tooltip: helptext.idmap_tdb2_script_tooltip,
    }];

  protected props: any;
  public step: any = 0;
  protected wsResponse: any;

  protected targetDS: any;
  protected idmap: any;
  public idmap_type: any;
  private idmap_domain_name: any = null;
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
          this.idmap_domain_name = 'DS_TYPE_ACTIVEDIRECTORY';
        } else if (res['service'] === 'ldap') {
          this.targetDS = 2;
          this.idmap_domain_name = 'DS_TYPE_LDAP';
        }
      }
      if (res['pk']) {
        this.idmap_type = res['pk'].toLowerCase();
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
      this.ws.call('idmap.get_or_create_idmap_by_domain', [this.idmap_domain_name]).subscribe((idmap_res) => {
        this.defaultIdmap = idmap_res;
      });
    });
                                                     
    this.ws.call('idmap.get_or_create_idmap_by_domain', [this.idmap_domain_name]).subscribe((res) => {
      if (res && res['id']) {
        this.idmapID = res['id'];
        for (let i in this.formGroup.controls) {
          if(_.endsWith(i, 'range_low')) {
              this.formGroup.controls[i].setValue(res['range_low']);
          } else if (_.endsWith(i, 'range_high')) {
            this.formGroup.controls[i].setValue(res['range_high']);
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
      this.error = helptext.idmap_range_comparison_error;
    } else {
      if (new_range_low < this.defaultIdmap['range_low'] || new_range_low > this.defaultIdmap['range_high']) {
        if (new_range_high < this.defaultIdmap['range_low'] || new_range_high > this.defaultIdmap['range_high']) {
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
              }
            );
          }
        } else {
          this.error = helptext.idmap_range_overlap_error + this.defaultIdmap['range_low'] + "," + this.defaultIdmap['range_high'] + "] !";
        }
      } else {
        this.error = helptext.idmap_range_overlap_error + this.defaultIdmap['range_low'] + "," + this.defaultIdmap['range_high'] + "] !";
      }
    }
  }

}
