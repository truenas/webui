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
  providers: [UserService]
})
export class CronFormComponent implements OnInit {

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
             required: true
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
     protected aroute: ActivatedRoute,
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
      });
     this.generateFieldConfig();
   }

   generateFieldConfig(){
     for(let i in this.fieldSets){
       for(let ii in this.fieldSets[i].config){
         this.fieldConfig.push(this.fieldSets[i].config[ii]);
       }
     }
   }

   customSubmit(value) {
     this.error = null;

     let body = this.buildBody(value);

     this.loader.open();
     if (this.isNew) {
       this.rest.post(this.resource_name + '/', {
         body: JSON.stringify(body)
       }, true).subscribe(
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
         body: JSON.stringify(body)
       }, true).subscribe(
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

   buildBody(value){
     let spl = value.cron_picker.split(" ");
     let body = {
       cron_minute: spl[0],
       cron_hour: spl[1],
       cron_daymonth: spl[2],
       cron_month: spl[3],
       cron_dayweek: spl[4],
       cron_command: value.cron_command,
       cron_description: value.cron_description,
       cron_enabled: value.cron_enabled,
       cron_stderr: value.cron_stderr,
       cron_stdout: value.cron_stdout,
       cron_user: value.cron_user
     }
     return body;
   }

}

