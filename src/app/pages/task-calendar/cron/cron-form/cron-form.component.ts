import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { TaskService, UserService, RestService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FormGroup } from '@angular/forms';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';

@Component({
  selector: 'cron-job-add',
  templateUrl: './cron-form.component.html',
  providers: [TaskService, UserService, EntityFormService]
})
export class CronFormComponent implements OnInit {

  protected resource_name: string = 'tasks/cronjob';
  public route_success: string[] = ['tasks', 'cron'];
  protected entityForm: EntityFormComponent;
  protected isEntity: boolean = true;
  protected isBasicMode: boolean = true;

  public fieldConfig: FieldConfig[] = [{
    type: 'input',
    name: 'cron_description',
    placeholder: 'Description'
  }, {
    type: 'input',
    name: 'cron_command',
    placeholder: 'Command',
  }, {
    type: 'select',
    name: 'cron_user',
    placeholder: 'Run As User',
    options: [],
  }, {
    type: 'input',
    inputType: 'time',
    name: 'cron_time',
    placeholder: 'Time',
  }, {
    type: 'input',
    inputType: 'date',
    name: 'cron_date',
    placeholder: 'Date',
  }, {
    type: 'select',
    name: 'cron_repeat',
    placeholder: 'Repeat',
    options: [
      { label: 'Once(Do not Repeat)', value: 'once' },
      { label: 'Hourly', value: 'hourly' },
      { label: 'Daily', value: 'daily' },
      { label: 'Weekly', value: 'weekly' },
      { label: 'Monthly', value: 'monthly' },
      { label: 'At Boot', value: 'boot' }
    ],
    value: 'once',
  }, {
    type: 'input',
    name: 'cron_minute',
    placeholder: 'Minute',
  }, {
    type: 'input',
    name: 'cron_hour',
    placeholder: 'Hour',
  }, {
    type: 'input',
    name: 'cron_daymonth',
    placeholder: 'Day of month',
  }, {
    type: 'select',
    name: 'cron_month',
    placeholder: 'Month',
    multiple: true,
    options: [{
      label: 'January',
      value: '1',
    }, {
      label: 'February',
      value: '2',
    }, {
      label: 'March',
      value: '3',
    }, {
      label: 'April',
      value: '4',
    }, {
      label: 'May',
      value: '5',
    }, {
      label: 'June',
      value: '6',
    }, {
      label: 'July',
      value: '7',
    }, {
      label: 'August',
      value: '8',
    }, {
      label: 'September',
      value: '9',
    }, {
      label: 'October',
      value: '10',
    }, {
      label: 'November',
      value: '11',
    }, {
      label: 'December',
      value: '12',
    }],
  }, {
    type: 'select',
    name: 'cron_dayweek',
    placeholder: 'Day of week',
    multiple: true,
    options: [{
      label: 'Monday',
      value: '1',
    }, {
      label: 'Tuesday',
      value: '2',
    }, {
      label: 'Wednesday',
      value: '3',
    }, {
      label: 'Thursday',
      value: '4',
    }, {
      label: 'Friday',
      value: '5',
    }, {
      label: 'Saturday',
      value: '6',
    }, {
      label: 'Sunday',
      value: '7',
    }],
  }, {
    type: 'checkbox',
    name: 'cron_stdout',
    placeholder: 'Redirect Stdout',
    value: true,
  }, {
    type: 'checkbox',
    name: 'cron_stderr',
    placeholder: 'Redirecr Stderr',
    value: false,
  }, {
    type: 'checkbox',
    name: 'cron_enabled',
    placeholder: 'Enable',
    value: true,
  }];

  protected user_field: any;
  protected month_field: any;
  protected day_field: any;
  protected mintue_field: any;
  protected hour_field: any;
  protected daymonth_field: any;

  protected basic_field: Array < any > = [
    'cron_time',
    'cron_date',
    'cron_repeat'
  ];

  protected advanced_field: Array < any > = [
    'cron_minute',
    'cron_hour',
    'cron_daymonth',
    'cron_month',
    'cron_dayweek',
  ];

  isCustActionVisible(actionname: string) {
    if (actionname === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } else if (actionname === 'basic_mode' && this.isBasicMode === true) {
      return false;
    }
    return true;
  }

  public custActions: Array < any > = [{
      'id': 'basic_mode',
      'name': 'Basic Mode',
      function: () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id': 'advanced_mode',
      'name': 'Advanced Mode',
      function: () => { this.isBasicMode = !this.isBasicMode; }
    }
  ];

  public formGroup: any;
  public error: string;
  protected pk: any;
  public isNew: boolean = false;
  protected data: any;

  constructor(protected router: Router,
    protected aroute: ActivatedRoute,
    protected taskService: TaskService,
    protected userService: UserService,
    protected entityFormService: EntityFormService,
    protected loader: AppLoaderService,
    protected rest: RestService) {}

  ngOnInit() {
    this.user_field = _.find(this.fieldConfig, { 'name': 'cron_user' });
    this.userService.listUsers().subscribe((res) => {
      res.data.forEach((item) => {
        this.user_field.options.push({ label: item.bsdusr_username, value: item.bsdusr_username })
      });
    });

    this.aroute.params.subscribe(params => {
      if (this.resource_name && !this.resource_name.endsWith('/')) {
        this.resource_name = this.resource_name + '/';
      }
      if (this.isEntity) {
        this.pk = params['pk'];
        if (this.pk && !this.isNew) {
          this.isBasicMode = false;
          //edit
        } else {
          //add
          this.isNew = true;
        }
      }
      this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
    });

    if (!this.isNew) {
      let query = this.resource_name + '/' + this.pk;
      this.rest.get(query, {}).subscribe((res) => {
        if (res.data) {
          this.data = res.data;
          for (let i in this.data) {
            let fg = this.formGroup.controls[i];
            if (fg) {
              let current_field = this.fieldConfig.find((control) => control.name === i);
              if (current_field.name == "cron_month" || current_field.name == "cron_dayweek") {
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
                fg.setValue(this.data[i]);
              }
            }
          }
        }
      });
    }
  }

  isShow(id: any): any {
    if (this.isBasicMode) {
      if (this.advanced_field.indexOf(id) > -1) {
        return false;
      }
    } else {
      if (this.basic_field != undefined && this.basic_field.indexOf(id) > -1) {
        return false;
      }
    }
    return true;
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    let value = _.cloneDeep(this.formGroup.value);

    // analysis date and time
    if (this.isBasicMode) {
      value['cron_dayweek'] = '*';
      value['cron_month'] = '*';
      value['cron_daymonth'] = '*';
      value['cron_hour'] = '*';
      value['cron_minute'] = '*';

      let date = value['cron_date'] + ' ' + value['cron_time'];
      if (value['cron_repeat'] == 'once') {
        value['cron_month'] = new Date(date).getMonth().toString();
        value['cron_dayweek'] = new Date(date).getDay().toString();
        value['cron_daymonth'] = new Date(date).getDate().toString();
        value['cron_hour'] = new Date(date).getHours().toString();
        value['cron_minute'] = new Date(date).getMinutes().toString();
      } else if (value['cron_repeat'] == 'hourly') {
        value['cron_minute'] = new Date(date).getMinutes().toString();
      } else if (value['cron_repeat'] == 'daily') {
        value['cron_minute'] = new Date(date).getMinutes().toString();
        value['cron_hour'] = new Date(date).getHours().toString();
      } else if (value['cron_repeat'] == 'monthly') {
        value['cron_minute'] = new Date(date).getMinutes().toString();
        value['cron_hour'] = new Date(date).getHours().toString();
        value['cron_daymonth'] = new Date(date).getDate().toString();
      } else if (value['cron_repeat'] == 'weekly') {
        value['cron_minute'] = new Date(date).getMinutes().toString();
        value['cron_hour'] = new Date(date).getHours().toString();
        value['cron_dayweek'] = new Date(date).getDay().toString();
      } else if (value['cron_repeat'] == 'boot') {

      }
    }

    this.loader.open();
    if (this.isNew) {
      this.rest.post(this.resource_name + '/', {
        body: JSON.stringify(value)
      }).subscribe(
        (res) => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.route_success));
        },
        (res) => {
          this.loader.close();
          console.log(res);
        });
    } else {
      this.rest.put(this.resource_name + '/' + this.pk, {
        body: JSON.stringify(value)
      }).subscribe(
        (res) => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.route_success));
        },
        (res) => {
          this.loader.close();
          console.log(res);
        });
    }

  }
}
