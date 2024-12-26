import {
  ChangeDetectionStrategy, Component, input, OnInit,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { map, Observable, of } from 'rxjs';
import { Option, nullOption, skipOption } from 'app/interfaces/option.interface';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-fc-ports-controls',
  templateUrl: './fc-ports-controls.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxSelectComponent,
    IxRadioGroupComponent,
    TranslateModule,
  ],
})
export class FcPortsControlsComponent implements OnInit {
  form = input.required<TargetFormComponent['fcForm']>();
  isEdit = input(false);

  isNewControl = this.fb.control(false);

  readonly isNewOptions$: Observable<Option<boolean>[]> = of([
    { label: this.translate.instant('Use an existing port'), value: false },
    { label: this.translate.instant('Create new virtual port'), value: true },
  ]);

  readonly creatingPortOptions$ = this.api.call('fc.fc_host.query').pipe(map((hosts) => {
    return hosts.map((host) => ({
      label: `${this.translate.instant('Create')} ${host.alias}/${host.npiv + 1}`,
      value: host.id,
    }));
  }));

  readonly existingPortOptions$ = this.api.call('fcport.port_choices', [false]).pipe(map((ports) => {
    const option = [{
      label: this.translate.instant('Do not connect to a fibre channel port'),
      value: nullOption,
    }];

    if (this.isEdit()) {
      option.push({
        label: this.translate.instant('Use current port'),
        value: skipOption,
      });
    }
    return option.concat(Object.entries(ports).map(([value]) => ({ label: value, value })));
  }));

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.form().controls.host_id.disable();
    this.isNewControl.valueChanges.pipe(untilDestroyed(this)).subscribe((isNew) => {
      if (isNew) {
        this.form().controls.port.disable();
        this.form().controls.host_id.enable();
        this.form().controls.port.setValue(null);
      } else {
        this.form().controls.port.enable();
        this.form().controls.host_id.disable();
        this.form().controls.host_id.setValue(null);
      }
    });
  }
}
