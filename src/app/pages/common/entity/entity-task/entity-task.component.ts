import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, UserService, RestService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FormGroup } from '@angular/forms';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { T } from '../../../../translate-marker';
import { TranslateService } from '@ngx-translate/core';
import { EntityUtils } from '../utils';

@Component({
  selector: 'entity-task',
  templateUrl: './entity-task.component.html',
  styleUrls: ['entity-task.component.css'],
  providers: [TaskService, UserService, EntityFormService]
})
export class EntityTaskComponent implements OnInit {
  @Input('conf') conf: any;

  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;

  protected user_field: any;
  protected month_field: any;
  protected day_field: any;
  protected mintue_field: any;
  protected hour_field: any;
  protected daymonth_field: any;

  public formGroup: any;
  public error: string;
  protected pk: any;
  public isNew: boolean = false;
  protected data: any;
  public showDefaults: boolean = false;

  protected preTaskName: string = '';

  constructor(protected router: Router,
    protected aroute: ActivatedRoute,
    protected taskService: TaskService,
    protected userService: UserService,
    protected entityFormService: EntityFormService,
    protected loader: AppLoaderService,
    protected rest: RestService) {}

  ngOnInit() {
    if (this.conf.preInit) {
      this.conf.preInit();
    }

    this.preTaskName = this.conf.preTaskName;

    let date = new Date();
    this.month_field = _.find(this.conf.fieldConfig, { 'name': this.preTaskName + '_month' });
    this.day_field = _.find(this.conf.fieldConfig, { 'name': this.preTaskName + '_dayweek' });
    this.daymonth_field = _.find(this.conf.fieldConfig, { 'name': this.preTaskName + '_daymonth' });
    this.hour_field = _.find(this.conf.fieldConfig, { 'name': this.preTaskName + '_hour' });
    this.mintue_field = _.find(this.conf.fieldConfig, { 'name': this.preTaskName + '_minute' });

    this.aroute.params.subscribe(params => {
      if (this.conf.resource_name && !this.conf.resource_name.endsWith('/')) {
        this.conf.resource_name = this.conf.resource_name + '/';
      }
      if (this.isEntity) {
        this.pk = params['pk'];
        if (this.pk && !this.isNew) {
          // only enable advanced mode
        } else {
          this.isNew = true;
        }
      }
      this.formGroup = this.entityFormService.createFormGroup(this.conf.fieldConfig);
      this.formGroup.controls[this.preTaskName + '_repeat'].valueChanges.subscribe((res) => {
        if (res == 'none') {
          this.month_field['isHidden'] = false;
          this.day_field['isHidden'] = false;
          this.daymonth_field['isHidden'] = false;
          this.hour_field['isHidden'] = false;
          if (this.mintue_field) {
            this.mintue_field['isHidden'] = false;
          }

          if (this.isNew) {
            this.formGroup.controls[this.preTaskName + '_month'].setValue([date.getMonth().toString()]);
            this.formGroup.controls[this.preTaskName + '_dayweek'].setValue([date.getDay().toString()]);
            this.formGroup.controls[this.preTaskName + '_daymonth'].setValue(date.getDate().toString());
            this.formGroup.controls[this.preTaskName + '_hour'].setValue(date.getHours().toString());
            if (this.mintue_field) {
              this.formGroup.controls[this.preTaskName + '_minute'].setValue(date.getMinutes().toString());
            }
          }
        } else if (res == 'hourly') {
          this.month_field['isHidden'] = true;
          this.day_field['isHidden'] = true;
          this.daymonth_field['isHidden'] = true;
          this.hour_field['isHidden'] = true;
          if (this.mintue_field) {
            this.mintue_field['isHidden'] = false;
          }

          if (this.isNew && this.mintue_field) {
            this.formGroup.controls[this.preTaskName + '_minute'].setValue(date.getMinutes().toString());
          }
        } else if (res == 'daily') {
          this.month_field['isHidden'] = true;
          this.day_field['isHidden'] = true;
          this.daymonth_field['isHidden'] = true;
          this.hour_field['isHidden'] = false;
          if (this.mintue_field) {
            this.mintue_field['isHidden'] = false;
          }

          if (this.isNew) {
            this.formGroup.controls[this.preTaskName + '_hour'].setValue(date.getHours().toString());
            if (this.mintue_field) {
              this.formGroup.controls[this.preTaskName + '_minute'].setValue(date.getMinutes().toString());
            }
          }
        } else if (res == 'weekly') {
          this.month_field['isHidden'] = true;
          this.day_field['isHidden'] = false;
          this.daymonth_field['isHidden'] = true;
          this.hour_field['isHidden'] = false;
          if (this.mintue_field) {
            this.mintue_field['isHidden'] = false;
          }

          if (this.isNew) {
            this.formGroup.controls[this.preTaskName + '_dayweek'].setValue([date.getDay().toString()]);
            this.formGroup.controls[this.preTaskName + '_hour'].setValue(date.getHours().toString());
            if (this.mintue_field) {
              this.formGroup.controls[this.preTaskName + '_minute'].setValue(date.getMinutes().toString());
            }
          }
        } else if (res == 'monthly') {
          this.month_field['isHidden'] = true;
          this.day_field['isHidden'] = true;
          this.daymonth_field['isHidden'] = false;
          this.hour_field['isHidden'] = false;
          if (this.mintue_field) {
            this.mintue_field['isHidden'] = false;
          }

          if (this.isNew) {
            this.formGroup.controls[this.preTaskName + '_daymonth'].setValue(date.getDate().toString());
            this.formGroup.controls[this.preTaskName + '_hour'].setValue(date.getHours().toString());
            if (this.mintue_field) {
              this.formGroup.controls[this.preTaskName + '_minute'].setValue(date.getMinutes().toString());
            }
          }
        }
      })
    });

    if (!this.isNew) {
      let query = this.conf.resource_name + '/' + this.pk;
      // if we want to use this again we will need to convert to websocket
      /*this.rest.get(query, {}).subscribe((res) => {
        if (res.data) {
          this.data = res.data;
          for (let i in this.data) {
            let fg = this.formGroup.controls[i];
            if (fg) {
              let current_field = this.conf.fieldConfig.find((control) => control.name === i);
              if (current_field.name == this.preTaskName + "_month" || current_field.name == this.preTaskName + "_dayweek") {
                // multiple select
                if (this.data[i] == '*') {
                  let human_value = [];
                  for (let i in current_field.options) {
                    human_value.push(current_field.options[i].value);
                  }
                  fg.setValue(human_value);
                } else {
                  let human_value = [];
                  for (let j in this.data[i]) {
                    if (_.find(current_field.options, { 'value': this.data[i][j] })) {
                      human_value.push(this.data[i][j]);
                    }
                  }
                  fg.setValue(human_value);
                }
              } else {
                if (current_field.name == "scrub_volume") {
                  this.taskService.getVolumeList().subscribe((res) => {
                    let volume = _.find(res.data, { 'vol_name': this.data[i] });
                    fg.setValue(volume['id']);
                  });
                } else {
                  fg.setValue(this.data[i]);
                }
              }
            }
          }

          if (_.isEqual(this.formGroup.controls[this.preTaskName + '_month'].value, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])) {
            if (_.isEqual(this.formGroup.controls[this.preTaskName + '_dayweek'].value, ['1', '2', '3', '4', '5', '6', '7'])) {
              if (this.formGroup.controls[this.preTaskName + '_daymonth'].value == '*') {
                if (this.formGroup.controls[this.preTaskName + '_hour'].value == '*') {
                  this.formGroup.controls[this.preTaskName + '_repeat'].setValue('hourly');
                } else {
                  this.formGroup.controls[this.preTaskName + '_repeat'].setValue('daily');
                }
              } else {
                this.formGroup.controls[this.preTaskName + '_repeat'].setValue('monthly');
              }
            } else {
              if (this.formGroup.controls[this.preTaskName + '_daymonth'].value == '*') {
                this.formGroup.controls[this.preTaskName + '_repeat'].setValue('weekly');
              }
            }
          }
        }
      });*/
      this.showDefaults = true;
    }

    if (this.conf.afterInit) {
      this.conf.afterInit(this);
    }

    setTimeout(() => { this.setShowDefaults(); }, 500);
  }

  setShowDefaults() {
    this.showDefaults = true;
  }

  isShow(name: any): any {
    if (this.conf.hide_fileds !== undefined) {
      if (this.conf.hide_fileds.indexOf(name) > -1) {
        return false;
      }
    }
    return true;
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.conf.route_success));
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    let value = _.cloneDeep(this.formGroup.value);

    if (value[this.preTaskName + '_repeat'] == 'hourly') {
      value[this.preTaskName + '_dayweek'] = '*';
      value[this.preTaskName + '_month'] = '*';
      value[this.preTaskName + '_daymonth'] = '*';
      value[this.preTaskName + '_hour'] = '*';
    } else if (value[this.preTaskName + '_repeat'] == 'daily') {
      value[this.preTaskName + '_dayweek'] = '*';
      value[this.preTaskName + '_month'] = '*';
      value[this.preTaskName + '_daymonth'] = '*';
    } else if (value[this.preTaskName + '_repeat'] == 'weekly') {
      value[this.preTaskName + '_month'] = '*';
      value[this.preTaskName + '_daymonth'] = '*';
    } else if (value[this.preTaskName + '_repeat'] == 'monthly') {
      value[this.preTaskName + '_dayweek'] = '*';
      value[this.preTaskName + '_month'] = '*';
    }

    this.loader.open();
    // if we want to use this we will need to convert to websocket
    /*if (this.isNew) {
      this.rest.post(this.conf.resource_name + '/', {
        body: JSON.stringify(value)
      }).subscribe(
        (res) => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.conf.route_success));
        },
        (res) => {
          this.loader.close();
          new EntityUtils().handleError(this, res);
        });
    } else {
      this.rest.put(this.conf.resource_name + '/' + this.pk, {
        body: JSON.stringify(value)
      }).subscribe(
        (res) => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.conf.route_success));
        },
        (res) => {
          this.loader.close();
          new EntityUtils().handleError(this, res);
        });
    }*/

  }
}
