import {
  ChangeDetectionStrategy, Component, computed, effect, input, OnInit,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { map, of } from 'rxjs';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';

export enum FibrePortOption {
  DoNotConnect = 1,
  UseExistingPort = 2,
  CreateNewPort = 3,
  KeepCurrentPort = 4,
}

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
  currentPort = input<string | null>(null);

  optionsControl = this.fb.control(FibrePortOption.DoNotConnect);

  protected readonly FibrePortOption = FibrePortOption;

  readonly portOptions = computed(() => {
    const baseOptions = [
      { label: this.translate.instant('Do not connect to a fibre channel port'), value: FibrePortOption.DoNotConnect },
      { label: this.translate.instant('Use an existing port'), value: FibrePortOption.UseExistingPort },
      { label: this.translate.instant('Create new virtual port'), value: FibrePortOption.CreateNewPort },
    ];

    if (this.isEdit() && this.currentPort()) {
      return of([
        {
          label: this.translate.instant('Keep current port {port}', { port: this.form().controls.port.value }),
          value: FibrePortOption.KeepCurrentPort,
        },
        ...baseOptions,
      ]);
    }

    return of(baseOptions);
  });

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
  ) {
    effect(() => {
      if (this.isEdit() && this.currentPort()) {
        this.optionsControl.setValue(FibrePortOption.KeepCurrentPort);
        this.form().controls.port.setValue(this.currentPort());
      }
    });
  }

  ngOnInit(): void {
    this.form().controls.host_id.disable();

    this.listenToOptionControlChanges();
  }

  private listenToOptionControlChanges(): void {
    this.optionsControl.valueChanges.pipe(untilDestroyed(this)).subscribe((option) => {
      this.form().controls.port.disable();
      this.form().controls.host_id.disable();

      if (option === FibrePortOption.DoNotConnect) {
        this.form().controls.port.setValue(null);
        this.form().controls.host_id.setValue(null);
      } else if (option === FibrePortOption.CreateNewPort) {
        this.form().controls.host_id.enable();
        this.form().controls.port.setValue(null);
      } else {
        this.form().controls.port.enable();
        this.form().controls.host_id.setValue(null);
      }
    });
  }
}
