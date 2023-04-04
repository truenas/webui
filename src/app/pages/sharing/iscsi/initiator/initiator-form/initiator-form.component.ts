import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IscsiGlobalSession } from 'app/interfaces/iscsi-global-config.interface';
import { IscsiInitiatorGroup } from 'app/interfaces/iscsi.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import {
  FieldConfig,
} from 'app/modules/entity/entity-form/models/field-config.interface';
import { RelationGroup } from 'app/modules/entity/entity-form/models/field-relation.interface';
import { RelationAction } from 'app/modules/entity/entity-form/models/relation-action.enum';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { FieldRelationService } from 'app/modules/entity/entity-form/services/field-relation.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import {
  DynamicListComponent,
} from 'app/pages/sharing/iscsi/initiator/initiator-form/dynamic-list/dynamic-list.component';
import { DialogService, NetworkService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './initiator-form.component.html',
  styleUrls: ['./initiator-form.component.scss', '../../../../../modules/entity/entity-form/entity-form.component.scss'],
  providers: [FieldRelationService, NetworkService],
})
export class InitiatorFormComponent implements OnInit {
  protected addCall = 'iscsi.initiator.create' as const;
  protected queryCall = 'iscsi.initiator.query' as const;
  protected editCall = 'iscsi.initiator.update' as const;
  protected customFilter: [[Partial<QueryFilter<IscsiInitiatorGroup>>]] = [[['id', '=']]];
  routeSuccess: string[] = ['sharing', 'iscsi', 'initiator'];
  protected pk: number;

  fieldConfig: FieldConfig[] = [
    {
      type: 'checkbox',
      name: 'all',
      placeholder: helptextSharingIscsi.all_placeholder_initiators,
      tooltip: '',
    },
    {
      type: 'input-list',
      name: 'initiators',
      placeholder: helptextSharingIscsi.initiator_form_placeholder_initiators,
      tooltip: helptextSharingIscsi.initiator_form_tooltip_initiators,
      customEventMethod: (parent: DynamicListComponent) => {
        for (const selected of parent.source.selectedOptions.selected) {
          parent.listControl.value.add(selected.value.initiator);
        }
        parent.source.deselectAll();
      },
      relation: [{
        action: RelationAction.Disable,
        when: [{
          name: 'all',
          value: true,
        }],
      }],
    },
    {
      type: 'input',
      name: 'comment',
      placeholder: helptextSharingIscsi.initiator_form_placeholder_comment,
      tooltip: helptextSharingIscsi.initiator_form_tooltip_comment,
    },
  ];

  formGroup: UntypedFormGroup;
  connectedInitiators: IscsiGlobalSession[];
  connectedInitiatorsDisabled = false;
  connectedInitiatorsTooltip = helptextSharingIscsi.initiator_form_tooltip_connected_initiators;
  error: string;

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    private errorHandler: ErrorHandlerService,
    protected loader: AppLoaderService,
    protected ws: WebSocketService,
    protected entityFormService: EntityFormService,
    protected fieldRelationService: FieldRelationService,
    protected dialogService: DialogService,
  ) { }

  getConnectedInitiators(): void {
    this.ws.call('iscsi.global.sessions').pipe(untilDestroyed(this)).subscribe({
      next: (sessions) => {
        this.connectedInitiators = _.unionBy(sessions, (item) => item.initiator && item.initiator_addr);
      },
      error: (error: WebsocketError) => {
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
  }

  ngOnInit(): void {
    this.getConnectedInitiators();

    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      if (params.pk) {
        this.pk = params.pk;
        this.customFilter[0][0].push(parseInt(params.pk, 10));
      }
    });

    this.formGroup = this.entityFormService.createFormGroup(this.fieldConfig);

    this.fieldConfig.forEach((config) => {
      if (config.relation.length > 0) {
        this.setRelation(config);
      }
    });

    this.formGroup.controls.initiators.statusChanges.pipe(untilDestroyed(this)).subscribe((status) => {
      this.connectedInitiatorsDisabled = status === 'DISABLED';
    });

    if (this.pk) {
      this.ws.call(this.queryCall, this.customFilter as [[QueryFilter<IscsiInitiatorGroup>]])
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (groups) => {
            Object.keys(groups[0]).forEach((i) => {
              const ctrl = this.formGroup.controls[i];
              if (ctrl) {
                if (i === 'initiators') {
                  ctrl.setValue(new Set(groups[0][i]));
                } else {
                  ctrl.setValue(groups[0][i as keyof IscsiInitiatorGroup]);
                }
              }
            });
            if (groups[0].initiators.length === 0) {
              this.formGroup.controls.all.setValue(true);
            }
          },
          error: (error: WebsocketError) => {
            this.dialogService.error(this.errorHandler.parseWsError(error));
          },
        });
    }
  }

  onSubmit(): void {
    this.error = null;
    const value = _.cloneDeep(this.formGroup.value);

    value.initiators = value.all ? [] : Array.from(value.initiators);
    delete value.initiators_input;
    delete value.auth_network_input;
    delete value.all;

    let submitFunction;
    if (this.pk === undefined) {
      submitFunction = this.ws.call(this.addCall, [value]);
    } else {
      submitFunction = this.ws.call(this.editCall, [this.pk, value]);
    }

    this.loader.open();
    submitFunction.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.routeSuccess));
      },
      error: (error: WebsocketError) => {
        this.loader.close();
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
  }

  goBack(): void {
    this.router.navigate(new Array('/').concat(this.routeSuccess));
  }

  setRelation(config: FieldConfig): void {
    if (!config) return;

    const activations = this.fieldRelationService.findActivationRelation(config.relation);
    if (activations) {
      const tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
        activations, this.formGroup,
      );
      const tobeHide = this.fieldRelationService.isFormControlToBeHide(
        activations, this.formGroup,
      );
      this.setDisabled(config.name, tobeDisabled, tobeHide);

      this.fieldRelationService.getRelatedFormControls(config, this.formGroup)
        .forEach((control) => {
          control.valueChanges.pipe(untilDestroyed(this)).subscribe(
            () => { this.relationUpdate(config, activations); },
          );
        });
    }
  }

  relationUpdate(config: FieldConfig, activations: RelationGroup): void {
    const tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
      activations, this.formGroup,
    );
    const tobeHide = this.fieldRelationService.isFormControlToBeHide(
      activations, this.formGroup,
    );
    this.setDisabled(config.name, tobeDisabled, tobeHide);
  }

  setDisabled(name: string, disable: boolean, hide?: boolean): void {
    // if field is hidden, disable it too
    if (hide) {
      disable = hide;
    } else {
      hide = false;
    }

    this.fieldConfig = this.fieldConfig.map((item) => {
      if (item.name === name) {
        item.disabled = disable;
        item.isHidden = hide;
      }
      return item;
    });

    if (this.formGroup.controls[name]) {
      if (disable) {
        this.formGroup.controls[name].disable();
      } else {
        this.formGroup.controls[name].enable();
      }
    }
  }
}
