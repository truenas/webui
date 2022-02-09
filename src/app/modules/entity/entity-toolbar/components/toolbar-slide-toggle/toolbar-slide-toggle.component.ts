import { Component, Input } from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IxAbstractObject } from 'app/core/classes/ix-abstract-object';
import { ControlConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { Control } from 'app/modules/entity/entity-toolbar/models/control.interface';
import { DialogService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'toolbar-slide-toggle',
  templateUrl: './toolbar-slide-toggle.component.html',
  styleUrls: ['toolbar-slide-toggle.component.scss'],
})
export class ToolbarSlideToggleComponent extends IxAbstractObject {
  @Input() config?: ControlConfig;
  @Input() controller: Subject<Control>;

  constructor(
    public translate: TranslateService,
    private dialogService: DialogService,
  ) {
    super();
  }

  onClick(event: Event | MouseEvent): void {
    event.preventDefault();

    if (this.config?.confirmOptions) {
      this.getConfirmation(!this.config.value);
    } else {
      this.setValue(!this.config.value);
    }
  }

  setValue(value: boolean): void {
    this.config.value = value;
    this.controller.next({ name: this.config.name, value });
  }

  getConfirmation(value: boolean): void {
    this.dialogService.confirm(this.config.confirmOptions).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.setValue(value);
    });
  }

  getIdentifier(): string {
    if (this.config.ixAutoIdentifier) {
      return this.config.ixAutoIdentifier;
    }
    return `${this.id}_entity_toolbar_${this.config.label}`;
  }
}
