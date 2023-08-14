import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { VmNicType, vmNicTypeLabels } from 'app/enums/vm.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/vm/vm-wizard/vm-wizard';
import { SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-network-interface-step',
  templateUrl: './network-interface-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkInterfaceStepComponent implements OnInit, SummaryProvider {
  form = this.formBuilder.group({
    nic_type: [VmNicType.Virtio, Validators.required],
    nic_mac: [helptext.NIC_mac_value, Validators.pattern(/\b([0-9A-F]{2}[:-]){5}([0-9A-F]){2}\b/i)],
    nic_attach: ['', Validators.required],
    trust_guest_rx_filters: [false],
  });

  readonly helptext = helptext;
  readonly nicTypeOptions$ = of(mapToOptions(vmNicTypeLabels, this.translate));
  readonly nicAttachOptions$ = this.ws.call('vm.device.nic_attach_choices').pipe(choicesToOptions());

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
  ) {}

  get isVirtio(): boolean {
    return this.form.value.nic_type === VmNicType.Virtio;
  }

  ngOnInit(): void {
    this.generateRandomMac();
  }

  getSummary(): SummarySection {
    const typeLabel = this.translate.instant(vmNicTypeLabels.get(this.form.value.nic_type));
    return [
      {
        label: this.translate.instant('NIC'),
        value: `${typeLabel} (${this.form.value.nic_attach})`,
      },
    ];
  }

  private generateRandomMac(): void {
    this.ws.call('vm.random_mac').pipe(untilDestroyed(this)).subscribe((mac) => {
      this.form.patchValue({ nic_mac: mac });
      this.cdr.markForCheck();
    });
  }
}
