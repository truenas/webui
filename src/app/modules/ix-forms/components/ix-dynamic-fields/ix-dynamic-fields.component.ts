import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DnsAuthenticatorType } from 'app/enums/dns-authenticator-type.enum';
import { AttributesSchema } from 'app/interfaces/attributes-schema.interface';

@UntilDestroy()
@Component({
  selector: 'ix-dynamic-fields',
  styleUrls: ['./ix-dynamic-fields.component.scss'],
  templateUrl: './ix-dynamic-fields.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class IxDynamicFieldsComponent {
  @Input() form: FormGroup;
  @Input() typeFields: string;
  @Input() selectFields: DnsAuthenticatorType;
  @Input() attributes: AttributesSchema[];
}
