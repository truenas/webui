import {
  ChangeDetectionStrategy, Component, computed, input, OnChanges,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { isNull, omitBy } from 'lodash-es';
import { of } from 'rxjs';
import { CompressionType, compressionTypeNames } from 'app/enums/compression-type.enum';
import { NetcatMode, netcatModeNames } from 'app/enums/netcat-mode.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextReplication } from 'app/helptext/data-protection/replication/replication';
import { helptextGlobal } from 'app/helptext/global-helptext';
import { newOption } from 'app/interfaces/option.interface';
import { ReplicationCreate, ReplicationTask } from 'app/interfaces/replication-task.interface';
import { SshCredentialsSelectComponent } from 'app/modules/forms/custom-selects/ssh-credentials-select/ssh-credentials-select.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';

@UntilDestroy()
@Component({
  selector: 'ix-replication-transport-section',
  templateUrl: './transport-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxFieldsetComponent,
    ReactiveFormsModule,
    SshCredentialsSelectComponent,
    IxSelectComponent,
    IxInputComponent,
    IxCheckboxComponent,
    TranslateModule,
  ],
})
export class TransportSectionComponent implements OnChanges {
  readonly replication = input<ReplicationTask>();
  readonly transport = input<TransportMode>();

  form = this.formBuilder.group({
    ssh_credentials: [null as number | typeof newOption],
    netcat_active_side: [NetcatMode.Local],
    netcat_active_side_listen_address: [null as string],
    netcat_active_side_port_min: [null as number],
    netcat_active_side_port_max: [null as number],
    netcat_passive_side_connect_address: [null as string],
    compression: [CompressionType.Disabled],
    speed_limit: [null as number],
    large_block: [true],
    compressed: [true],
  });

  readonly netcatActiveSides$ = of(mapToOptions(netcatModeNames, this.translate));
  readonly compressions$ = of(mapToOptions(compressionTypeNames, this.translate));

  readonly sizeSuggestion = this.translate.instant(helptextGlobal.human_readable.suggestion_label);

  protected readonly helptext = helptextReplication;

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    public formatter: IxFormatterService,
  ) { }

  ngOnChanges(): void {
    if (this.replication()) {
      this.setFormValues(this.replication());
    }

    if (this.isLocal()) {
      this.form.controls.ssh_credentials.disable();
    } else {
      this.form.controls.ssh_credentials.enable();
    }
  }

  protected isLocal = computed(() => {
    return this.transport() === TransportMode.Local;
  });

  protected isNetcat = computed(() => {
    return this.transport() === TransportMode.Netcat;
  });

  protected isSsh = computed(() => {
    return this.transport() === TransportMode.Ssh;
  });

  setFormValues(replication: ReplicationTask): void {
    this.form.patchValue({
      ...replication,
      ssh_credentials: replication.ssh_credentials?.id || null,
      compression: replication.compression || CompressionType.Disabled,
    });

    if (replication.large_block) {
      this.form.controls.large_block.disable();
    } else {
      this.form.controls.large_block.enable();
    }
  }

  getPayload(): Partial<ReplicationCreate> {
    const values = this.form.getRawValue();

    if (this.isLocal()) {
      return {
        large_block: values.large_block,
        compressed: values.compressed,
        ssh_credentials: null,
        netcat_active_side: null,
        netcat_active_side_listen_address: null,
        netcat_active_side_port_min: null,
        netcat_active_side_port_max: null,
        netcat_passive_side_connect_address: null,
      };
    }

    if (this.isSsh()) {
      return {
        ...omitBy({
          ssh_credentials: values.ssh_credentials,
          compression: values.compression === CompressionType.Disabled ? null : values.compression,
          speed_limit: values.speed_limit,
          large_block: values.large_block,
          compressed: values.compressed,
        }, isNull),
        netcat_active_side: null,
        netcat_active_side_listen_address: null,
        netcat_active_side_port_min: null,
        netcat_active_side_port_max: null,
        netcat_passive_side_connect_address: null,
      };
    }

    return {
      ...omitBy({
        ssh_credentials: values.ssh_credentials,
        large_block: values.large_block,
        compressed: values.compressed,
        netcat_active_side: values.netcat_active_side,
        netcat_active_side_listen_address: values.netcat_active_side_listen_address,
        netcat_active_side_port_min: values.netcat_active_side_port_min,
        netcat_active_side_port_max: values.netcat_active_side_port_max,
        netcat_passive_side_connect_address: values.netcat_passive_side_connect_address,
      }, isNull),
      speed_limit: null,
    };
  }
}
