import { Component, OnInit } from '@angular/core';
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
  providers: [TaskService, UserService, EntityFormService]
})
export class CronFormComponent implements OnInit {

  /*
   protected entityForm: EntityFormComponent;
   protected isEntity: boolean = true;*/

   protected resource_name: string = 'tasks/cronjob';
   public route_success: string[] = ['tasks', 'cron'];
   //public target: Subject<CoreEvent> = new Subject();
   //public values = [];
   
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
       name:'Add a Cron Job',
       class:'add-cron',
       label:true,
       width:'300px',
       config: [
         {
           type: 'input',
           name: 'cron_description',
           placeholder: T('Description'),
           tooltip: T('Optional. Describe the new task.'),
         }, 
         {
           type: 'input',
           name: 'cron_command',
           placeholder: T('Command'),
           required: true,
           validation : [ Validators.required ],
           tooltip: T('Enter the full path to the command or script to be run.'),
         }, 
         {
           type: 'select',
           name: 'cron_user',
           placeholder: T('Run As User'),
           tooltip: T('Choose a user account to run the <b>Command</b>. The\
             user must have permission to run the <b>Command</b>.'),
             options: [],
             required: true,
             validation : [ Validators.required ],
         }, 
         {
           type: 'scheduler',
           name: 'cron_picker',
           placeholder: T('Schedule a Cron Job'),
           tooltip: T('Choose one of the convenient presets\
             or choose <b>Custom</b> to trigger the advanced scheduler UI'),
             //options: [],
             required: true//,
             //validation : [ Validators.required ],
         }, 
         {
           type: 'checkbox',
           name: 'cron_stdout',
           placeholder: T('Redirect Standard Output'),
           tooltip: T('Set to disable emailing standard output (stdout) to the\
             <i>root</i> user account.'),
             value: true,
         }, 
         {
           type: 'checkbox',
           name: 'cron_stderr',
           placeholder: T('Redirect Errors'),
           tooltip: T('Set to disable emailing errors (stderr) to the\
             <i>root</i> user account.'),
             value: false,
         }, 
         {
           type: 'checkbox',
           name: 'cron_enabled',
           placeholder: T('Enabled'),
           tooltip: T('Unset to disable the cron job without deleting it.'),
           value: true,
         }
       ]
     }
   ];

   constructor(
     protected userService: UserService,
     protected router: Router, 
     protected rest: RestService,
     protected ws: WebSocketService,
     //protected _injector: Injector, 
     //protected _appRef: ApplicationRef,
     protected loader: AppLoaderService,
     private core:CoreService
   ) {}

   ngOnInit(){
     this.init();
   }

   init(){
     // Setup user field options
     this.userService.listUsers().subscribe((res) => {
       res.data.forEach((item) => {
         let user_field = _.find(this.fieldSets[0].config, {'name': 'cron_user'});
         user_field.options.push({ label: item.bsdusr_username, value: item.bsdusr_username })
       });
     });

     // React to form data
     /*this.target.subscribe((evt:CoreEvent) => {
       switch(evt.name){
       case "FormSubmitted":
         console.log("Form Submitted");
         console.log(evt.data);
         
         break;
        case "Cancel":
          //this.router.navigate(new Array('').concat(['ui-preferences', 'create-theme']));
          this.router.navigate(new Array('').concat(this.route_success));
          break;
       }
     });*/
     this.generateFieldConfig();
   }

   generateFieldConfig(){
     for(let i in this.fieldSets){
       for(let ii in this.fieldSets[i].config){
         this.fieldConfig.push(this.fieldSets[i].config[ii]);
       }
     }
   }

   onSubmit(evt) {
     evt.preventDefault();
     evt.stopPropagation();
     this.error = null;
     let value = _.cloneDeep(this.formGroup.value);

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




/*protected user_field: any;
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

 constructor(protected router: Router,
   protected aroute: ActivatedRoute,
   protected taskService: TaskService,
   protected userService: UserService,
   protected entityFormService: EntityFormService,
   protected loader: AppLoaderService,
   protected rest: RestService) {}

   ngOnInit() {
     let date = new Date();
     this.month_field = _.find(this.fieldConfig, { 'name': 'cron_month' });
     this.day_field = _.find(this.fieldConfig, { 'name': 'cron_dayweek' });
     this.daymonth_field = _.find(this.fieldConfig, { 'name': 'cron_daymonth' });
     this.hour_field = _.find(this.fieldConfig, { 'name': 'cron_hour' });
     this.mintue_field = _.find(this.fieldConfig, { 'name': 'cron_minute' });

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
           // only enable advanced mode
           } else {
             this.isNew = true;
           }
       }
       this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
       this.formGroup.controls['cron_repeat'].valueChanges.subscribe((res) => {
         if (res == 'none') {
           this.month_field.isHidden = false;
           this.day_field.isHidden = false;
           this.daymonth_field.isHidden = false;
           this.hour_field.isHidden = false;
           this.mintue_field.isHidden = false;

           if (this.isNew) {
             this.formGroup.controls['cron_month'].setValue([date.getMonth().toString()]);
             this.formGroup.controls['cron_dayweek'].setValue([date.getDay().toString()]);
             this.formGroup.controls['cron_daymonth'].setValue(date.getDate().toString());
             this.formGroup.controls['cron_hour'].setValue(date.getHours().toString());
             this.formGroup.controls['cron_minute'].setValue(date.getMinutes().toString());
           }
         } else if (res == 'hourly') {
           this.month_field.isHidden = true;
           this.day_field.isHidden = true;
           this.daymonth_field.isHidden = true;
           this.hour_field.isHidden = true;
           this.mintue_field.isHidden = false;

           if (this.isNew) {
             this.formGroup.controls['cron_minute'].setValue(date.getMinutes().toString());
           }
         } else if (res == 'daily') {
           this.month_field.isHidden = true;
           this.day_field.isHidden = true;
           this.daymonth_field.isHidden = true;
           this.hour_field.isHidden = false;
           this.mintue_field.isHidden = false;

           if (this.isNew) {
             this.formGroup.controls['cron_hour'].setValue(date.getHours().toString());
             this.formGroup.controls['cron_minute'].setValue(date.getMinutes().toString());
           }
         } else if (res == 'weekly') {
           this.month_field.isHidden = true;
           this.day_field.isHidden = false;
           this.daymonth_field.isHidden = true;
           this.hour_field.isHidden = false;
           this.mintue_field.isHidden = false;

           if (this.isNew) {
             this.formGroup.controls['cron_dayweek'].setValue([date.getDay().toString()]);
             this.formGroup.controls['cron_hour'].setValue(date.getHours().toString());
             this.formGroup.controls['cron_minute'].setValue(date.getMinutes().toString());
           }
         } else if (res == 'monthly') {
           this.month_field.isHidden = true;
           this.day_field.isHidden = true;
           this.daymonth_field.isHidden = false;
           this.hour_field.isHidden = false;
           this.mintue_field.isHidden = false;

           if (this.isNew) {
             this.formGroup.controls['cron_daymonth'].setValue(date.getDate().toString());
             this.formGroup.controls['cron_hour'].setValue(date.getHours().toString());
             this.formGroup.controls['cron_minute'].setValue(date.getMinutes().toString());
           }
         }
       })
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

           if (_.isEqual(this.formGroup.controls['cron_month'].value, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])) {
             if (_.isEqual(this.formGroup.controls['cron_dayweek'].value, ['1', '2', '3', '4', '5', '6', '7'])) {
               if (this.formGroup.controls['cron_daymonth'].value == '*') {
                 if (this.formGroup.controls['cron_hour'].value == '*') {
                   this.formGroup.controls['cron_repeat'].setValue('hourly');
                 } else {
                   this.formGroup.controls['cron_repeat'].setValue('daily');
                 }
               } else {
                 this.formGroup.controls['cron_repeat'].setValue('monthly');
               }
             } else {
               if (this.formGroup.controls['cron_daymonth'].value == '*') {
                 this.formGroup.controls['cron_repeat'].setValue('weekly');
               }
             }
           }
         }
       });
     }
   }

   goBack() {
     this.router.navigate(new Array('').concat(this.route_success));
   }

   onSubmit(event: Event) {
     event.preventDefault();
     event.stopPropagation();
     this.error = null;
     let value = _.cloneDeep(this.formGroup.value);

     if (value['cron_repeat'] == 'hourly') {
       value['cron_dayweek'] = '*';
       value['cron_month'] = '*';
       value['cron_daymonth'] = '*';
       value['cron_hour'] = '*';
     } else if (value['cron_repeat'] == 'daily') {
       value['cron_dayweek'] = '*';
       value['cron_month'] = '*';
       value['cron_daymonth'] = '*';
     } else if (value['cron_repeat'] == 'weekly') {
       value['cron_month'] = '*';
       value['cron_daymonth'] = '*';
     } else if (value['cron_repeat'] == 'monthly') {
       value['cron_dayweek'] = '*';
       value['cron_month'] = '*';
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
}*/
