import {
  ApplicationRef, Input, Output, EventEmitter, Component, Injector, OnInit, TemplateRef,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { WebSocketService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { FieldConfig } from '../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../common/entity/entity-form/models/fieldset.interface';
import { EntityFormService } from '../common/entity/entity-form/services/entity-form.service';
import { EntityUtils } from '../common/entity/utils';

@UntilDestroy()
@Component({
  selector: 'dashboard-note-edit',
  templateUrl: './dashboard-note-edit.component.html',
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

  notes: any[] ;
  protected targetNoteIndex: number;

  constructor(
    protected router: Router,
    protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef,
    protected loader: AppLoaderService,
    protected entityFormService: EntityFormService,
  ) {}

  ngOnInit(): void {
    this.generateFieldConfig();
    if (!this.isNew) {
      _.find(this.fieldConfig, { name: 'title' }).readonly = true;
    }
    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

    if (!this.isNew) {
      for (const i in this.cardNote) {
        const fg = this.formGroup.controls[i];
        if (fg) {
          fg.setValue(this.cardNote[i]);
        }
      }
    }
  }

  generateFieldConfig(): void {
    for (const i in this.fieldSets) {
      for (const ii in this.fieldSets[i].config) {
        this.fieldConfig.push(this.fieldSets[i].config[ii]);
      }
    }
  }

  goBack(): void {
    const result: { flipState: boolean } = { flipState: false };
    this.cancel.emit(result); // <-- bool = isFlipped State
  }

  onSuccess(message?: any): void {
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

  clearErrors(): void {
    for (let f = 0; f < this.fieldConfig.length; f++) {
      this.fieldConfig[f]['errors'] = '';
      this.fieldConfig[f]['hasErrors'] = false;
    }
  }

  onSubmit(event: Event): void {
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
    this.ws.call('user.set_attribute', [1, attribute_key, value['content']])
      .pipe(untilDestroyed(this)).subscribe(
        () => {
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
