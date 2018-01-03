import { ApplicationRef, Input, Output, EventEmitter, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { MdSnackBar } from '@angular/material';
import * as _ from 'lodash';
import { FieldConfig } from '../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../common/entity/entity-form/models/fieldset.interface';
import { EntityFormService } from '../common/entity/entity-form/services/entity-form.service';

import { RestService, WebSocketService } from '../../services/';
import { AppLoaderService } from '../../services/app-loader/app-loader.service';
import { Subscription } from 'rxjs';
import { EntityUtils } from '../common/entity/utils';

@Component({
  selector: 'dashboard-note-edit',
  templateUrl: './dashboard-note-edit.component.html',
  //template: `<entity-form-embedded [args]="machineId" [conf]="this"></entity-form-embedded>`,
  providers: [EntityFormService]
})
export class DashboardNoteEditComponent implements OnInit {

  @Input() machineId: string = '';
  @Output() cancel: EventEmitter < any > = new EventEmitter < any > ();
  @Output() saved: EventEmitter < any > = new EventEmitter < any > ();
  @Input() isNew: boolean = false;
  @Input() userConf: Array < any > = [];

  protected resource_name: string = 'vm/vm/' + this.machineId;
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [];

  public fieldSetDisplay: string = 'default'; //default | carousel | stepper
  public fieldSets: FieldSet[] = [{
    name: 'Config',
    class: 'config',
    config: [
      { type: 'input', name: 'title', placeholder: 'Title' },
      { type: 'textarea', name: 'content', placeholder: 'Content' },
    ]
  }];
  private bootloader: any;
  public bootloader_type: any[];

  public error: any;
  public success: any;
  protected formGroup: FormGroup;
  public busy: Subscription;

  public notes: Array < any > ;
  protected targetNoteIndex: number;

  constructor(protected router: Router, protected rest: RestService,
    protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef,
    protected loader: AppLoaderService,
    public snackBar: MdSnackBar,
    protected entityFormService: EntityFormService,
  ) {}

  ngOnInit() {
    this.generateFieldConfig();
    if (this.userConf['user_dashboard_notes']) {
      this.notes = this.userConf['user_dashboard_notes'];
    } else {
      this.notes = [];
    }
    
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);
  
    if (!this.isNew) {
      this.targetNoteIndex = _.findIndex(this.notes, {id: this.machineId});
      for (let i in this.notes[this.targetNoteIndex]) {
        let fg = this.formGroup.controls[i];
        if (fg) {
          let current_field = this.fieldConfig.find((control) => control.name === i);
          fg.setValue(this.notes[this.targetNoteIndex][i]);
        }
      }
    }
  }

  generateFieldConfig() {
    for (let i in this.fieldSets) {
      for (let ii in this.fieldSets[i].config) {
        this.fieldConfig.push(this.fieldSets[i].config[ii]);
      }
    }
  }

  goBack() {
    let result: { flipState: boolean; } = { flipState: false }
    this.cancel.emit(result); // <-- bool = isFlipped State
  }

  onSuccess(message ? : any) {
    let result: { flipState: boolean;id ? : any } = { flipState: false, id: message };
    if (message.data) {
      result.id = message.data.id;
    } else {
      result.id = message;
    }
    if (result.id) {
      this.saved.emit(result);
    }
  }

  clearErrors() {
    for (let f = 0; f < this.fieldConfig.length; f++) {
      this.fieldConfig[f].errors = '';
      this.fieldConfig[f].hasErrors = false;
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    this.success = false;
    this.clearErrors();
    let value = _.cloneDeep(this.formGroup.value);

    if (this.isNew) {
      let new_id: number;
      if (this.notes.length == 0) {
        new_id = 1;
      } else {
        new_id = _.last(this.notes).id + 1;
      }
      value['id'] = new_id;
      this.notes.push(value);
    } else {
      value['id'] = this.machineId;
      this.notes[this.targetNoteIndex] = value;
    }
    
    this.loader.open();
    this.busy = this.ws.call('user.update', [1, { attributes: { usertheme: this.userConf['usertheme'], user_dashboard_notes: this.notes } }])
      .subscribe(
        (res) => {
          this.loader.close();
          this.snackBar.open("All your settings are saved.", 'close', { duration: 5000 })
          this.success = true;
          this.onSuccess(res);
        },
        (res) => {
          this.loader.close();
          new EntityUtils().handleError(this, res);
        }
      );
  }

}
