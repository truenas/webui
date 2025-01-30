import {
  ChangeDetectionStrategy, Component, input, OnInit,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { map, Observable, of } from 'rxjs';
import { Option, skipOption } from 'app/interfaces/option.interface';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';

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

  optionsControl = this.fb.control(null);

  readonly isNewOptions$: Observable<Option<boolean | null>[]> = of([
    { label: this.translate.instant('Do not connect to a fibre channel port'), value: null },
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
    return Object.entries(ports).map(([value]) => ({ label: value, value }));
  }));

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.form().controls.host_id.disable();
    this.form().controls.port.setValue(skipOption);

    this.listenToOptionControlChanges();
  }

  private listenToOptionControlChanges(): void {
    this.optionsControl.valueChanges.pipe(untilDestroyed(this)).subscribe((isNew) => {
      if (isNew === null) {
        this.form().controls.port.setValue(skipOption);
        this.form().controls.host_id.setValue(null);
        this.form().controls.host_id.disable();
      } else if (isNew) {
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
