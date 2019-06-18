import { Component, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { UserService } from '../../../../services/';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { RestService, WebSocketService } from 'app/services/';
import helptext from '../../../../helptext/task-calendar/cron/cron-form';

@Component({
  selector: 'cron-job-add',
  templateUrl: './cron-form.component.html',
  styleUrls: ['cron-form.component.css'],
  providers: [UserService]
})
export class CronFormComponent {

   protected resource_name: string = 'tasks/cronjob';
   public route_success: string[] = ['tasks', 'cron'];

   public formGroup: any;
   public error: string;
   protected pk: any;
   public isNew: boolean = false;
   protected data: any;
   protected user_field: any;

   public saveSubmitText = "Save Cron Job";
   protected isEntity: boolean = true; // was true
   public fieldConfig:FieldConfig[] = [];
   public fieldSetDisplay:string = 'no-margins';

   public fieldSets: FieldSet[] = [
     {
       name:'Cron Job',
       class:'add-cron',
       label:true,
       width:'300px',
       config: [
         {
          type: 'input',
          name: 'cron_description',
          placeholder: helptext.cron_description_placeholder,
          tooltip: helptext.cron_description_tooltip
         },
         {
          type: 'input',
          name: 'cron_command',
          placeholder: helptext.cron_command_placeholder,
          required: true,
          validation : helptext.cron_command_validation,
          tooltip: helptext.cron_command_tooltip
         },
         {
           type: 'combobox',
           name: 'cron_user',
           placeholder: helptext.cron_user_placeholder,
           tooltip: helptext.cron_user_tooltip,
           options: [],
           required: true,
           validation : helptext.cron_user_validation,
           searchOptions: [],
          parent: this,
          updater: this.updateUserSearchOptions,
         },
         {
           type: 'scheduler',
           name: 'cron_picker',
           placeholder: helptext.cron_picker_placeholder,
           tooltip: helptext.cron_picker_tooltip,
           validation: helptext.cron_picker_validation,
           required: true,
           value: "0 0 * * *"
         },
         {
           type: 'checkbox',
           name: 'cron_stdout',
           placeholder: helptext.cron_stdout_placeholder,
           tooltip: helptext.cron_stdout_tooltip,
           value: true,
         },
         {
           type: 'checkbox',
           name: 'cron_stderr',
           placeholder: helptext.cron_stderr_placeholder,
           tooltip: helptext.cron_stderr_tooltip,
           value: false,
         },
         {
           type: 'checkbox',
           name: 'cron_enabled',
           placeholder: helptext.cron_enabled_placeholder,
           tooltip: helptext.cron_enabled_tooltip,
           value: true,
         }
       ]
     }
   ];

   @ViewChild('form', { static: true}) form:EntityFormComponent;

   constructor(
     protected userService: UserService,
     protected router: Router,
     protected rest: RestService,
     protected ws: WebSocketService,
     protected aroute: ActivatedRoute,
     protected loader: AppLoaderService,
     private core:CoreService
   ){}

   preInit(entityForm){
     // Setup user field options
     this.user_field = _.find(this.fieldSets[0].config, {'name': 'cron_user'});
     this.userService.listAllUsers().subscribe((res) => {
      let items = res.data.items;
      for (let i = 0; i < items.length; i++) {
         this.user_field.options.push({label: items[i].label, value: items[i].id});
       }
     });

    }

  updateUserSearchOptions(value = "", parent) {
    parent.userService.listAllUsers(value).subscribe(res => {
      let users = [];
      let items = res.data.items;
      for (let i = 0; i < items.length; i++) {
        users.push({label: items[i].label, value: items[i].id});
      }
      parent.user_field.searchOptions = users;
    });
  }


   resourceTransformIncomingRestData(data) {
     data['cron_picker'] = data.cron_minute + " " +
                           data.cron_hour + " " +
                           data.cron_daymonth + " " +
                           data.cron_month + " " +
                           data.cron_dayweek;
     return data;
   }


   afterInit(entityForm){
   }

   beforeSubmit(value){
     let spl = value.cron_picker.split(" ");
     delete value.cron_picker;
     value['cron_minute'] = spl[0];
     value['cron_hour'] = spl[1];
     value['cron_daymonth'] = spl[2];
     value['cron_month'] = spl[3];
     value['cron_dayweek'] = spl[4];
   }

}
