import {
  Component, Input, OnInit,
} from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { GlobalAction } from 'app/interfaces/global-action.interface';
import { EntityTableAddActionsConfig } from 'app/pages/common/entity/entity-table/entity-table-add-actions/entity-table-add-actions-config.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction } from 'app/pages/common/entity/entity-table/entity-table.interface';

@UntilDestroy()
@Component({
  selector: 'app-entity-table-add-actions',
  templateUrl: './entity-table-add-actions.component.html',
  styleUrls: ['./entity-table-add-actions.component.scss'],
})
export class EntityTableAddActionsComponent implements GlobalAction, OnInit {
  @Input() entity: EntityTableComponent;
  conf: EntityTableAddActionsConfig;

  actions: EntityTableAction[];
  menuTriggerMessage = 'Click for options';

  spin = true;
  direction = 'left';
  animationMode = 'fling';

  form = this.fb.group({
    search: [''],
  });

  get totalActions(): number {
    const addAction = this.entity.conf.route_add || this.entity.conf.doAdd ? 1 : 0;
    return this.actions.length + addAction;
  }

  constructor(
    private fb: FormBuilder,
    protected translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.actions = this.entity.getAddActions();
    this.form.controls.search.valueChanges.pipe(untilDestroyed(this)).subscribe(
      (value: string) => {
        this.entity.filter(value);
      },
    );
  }

  applyConfig(entity: EntityTableComponent): void {
    this.entity = entity;
    this.conf = entity.conf;
  }
}
