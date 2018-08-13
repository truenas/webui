import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { EntityFormEmbeddedComponent, FormConfig } from '../../../common/entity/entity-form/entity-form-embedded.component';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { TaskService, UserService } from '../../../../services/';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { FormGroup, Validators } from '@angular/forms';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Subject } from 'rxjs/Subject';
import { T } from '../../../../translate-marker';
import {RestService, WebSocketService} from 'app/services/';
import { TranslateService } from '@ngx-translate/core';

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
           placeholder: T('Description'),
           tooltip: T('Enter a description of the cron job.'),
         },
         {
           type: 'input',
           name: 'cron_command',
           placeholder: T('Command'),
           required: true,
           validation : [ Validators.required ],
           tooltip: T('Enter the full path to the command or script to\
                       be run.'),
         },
         {
           type: 'combobox',
           name: 'cron_user',
           placeholder: T('Run As User'),
           tooltip: T('Select a user account to run the command. The\
                       user must have permissions allowing them to run\
                       the command or script.'),
           options: [],
           required: true,
           validation : [ Validators.required ],
         },
         {
           type: 'scheduler',
           name: 'cron_picker',
           placeholder: T('Schedule a Cron Job'),
           tooltip: T('Select a schedule preset or choose <i>Custom</i>\
                       to open the advanced scheduler.'),
           validation: [ Validators.required ],
           required: true,
           value: "0 0 * * *"
         },
         {
           type: 'checkbox',
           name: 'cron_stdout',
           placeholder: T('Redirect Standard Output'),
           tooltip: T('Redirect stdout to /dev/null. When unset, output\
                       from the command is mailed to the user running\
                       the cron job.'),
           value: true,
         },
         {
           type: 'checkbox',
           name: 'cron_stderr',
           placeholder: T('Redirect Standard Error'),
           tooltip: T('Redirect stderr to /dev/null. When unset, error\
                       output from the command is mailed to the user\
                       running the cron job.'),
           value: false,
         },
         {
           type: 'checkbox',
           name: 'cron_enabled',
           placeholder: T('Enabled'),
           tooltip: T('Enable this cron job. When unset, disable the\
                       cron job without deleting it.'),
           value: true,
         }
       ]
     }
   ];

   @ViewChild('form') form:EntityFormComponent;

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
     this.userService.listUsers().subscribe((res) => {
       res.data.forEach((item) => {
         let user_field = _.find(this.fieldSets[0].config, {'name': 'cron_user'});
         user_field.options.push({ label: item.bsdusr_username, value: item.bsdusr_username })
       });
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
