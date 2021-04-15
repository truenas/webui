import {
  ApplicationRef, Input, Output, EventEmitter, Component, Injector, OnInit, ViewContainerRef, TemplateRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import * as _ from 'lodash';
import { FieldConfig } from '../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../common/entity/entity-form/models/fieldset.interface';
import { EntityFormService } from '../common/entity/entity-form/services/entity-form.service';

import { RestService, WebSocketService } from '../../services';
import { AppLoaderService } from '../../services/app-loader/app-loader.service';
import { Subscription } from 'rxjs';
import { EntityUtils } from '../common/entity/utils';

@Component({
  selector: 'dashboard-note-edit',
  templateUrl: './dashboard-note-edit.component.html',
  // template: `<entity-form-embedded [args]="machineId" [conf]="this"></entity-form-embedded>`,
  providers: [EntityFormService],
})
export class DashboardNoteEditComponent implements OnInit {
  @Input() machineId = '';
  @Output() cancel: EventEmitter < any > = new EventEmitter < any >();
  @Output() saved: EventEmitter < any > = new EventEmitter < any >();
  @Input() isNew = false;
  @Input() cardNote: any = {};

  templateTop: TemplateRef<any>;
  protected resource_name: string = 'vm/vm/' + this.machineId;
  protected isEntity = true;

  fieldConfig: FieldConfig[] = [];

  fieldSetDisplay = 'default'; // default | carousel | stepper
  fieldSets: FieldSet[] = [{
    name: 'Config',
    class: 'config',
    config: [
      {
        type: 'input', name: 'title', placeholder: 'Title', readonly: false,
      },
      { type: 'textarea', name: 'content', placeholder: 'Content' },
    ],
  }];
  private bootloader: any;
  bootloader_type: any[];

  error: any;
  success: any;
  protected formGroup: FormGroup;
  busy: Subscription;

  notes: any[] ;
  protected targetNoteIndex: number;

  constructor(protected router: Router, protected rest: RestService,
    protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef,
    protected loader: AppLoaderService,
    protected entityFormService: EntityFormService) {}

  ngOnInit() {
    this.generateFieldConfig();
    if (!this.isNew) {
      _.find(this.fieldConfig, { name: 'title' }).readonly = true;
    }
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

    if (!this.isNew) {
      for (const i in this.cardNote) {
        const fg = this.formGroup.controls[i];
        if (fg) {
          const current_field = this.fieldConfig.find((control) => control.name === i);
          fg.setValue(this.cardNote[i]);
        }
      }
    }
  }

  generateFieldConfig() {
    for (const i in this.fieldSets) {
      for (const ii in this.fieldSets[i].config) {
        this.fieldConfig.push(this.fieldSets[i].config[ii]);
      }
    }
  }

  goBack() {
    const result: { flipState: boolean } = { flipState: false };
    this.cancel.emit(result); // <-- bool = isFlipped State
  }

  onSuccess(message?: any) {
    const result: { flipState: boolean;id?: any } = { flipState: false, id: message };
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
      this.fieldConfig[f]['errors'] = '';
      this.fieldConfig[f]['hasErrors'] = false;
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    this.success = false;
    this.clearErrors();
    const value = _.cloneDeep(this.formGroup.value);
    let attribute_key = '';
    if (this.isNew) {
      attribute_key = 'note_' + value['title'];
    } else {
      attribute_key = this.cardNote['id'];
    }
    this.loader.open();
    this.busy = this.ws.call('user.set_attribute', [1, attribute_key, value['content']])
      .subscribe(
        (res) => {
          this.loader.close();
          this.success = true;
          this.onSuccess(attribute_key);
        },
        (res) => {
          this.loader.close();
          new EntityUtils().handleError(this, res);
        },
      );
  }
}
