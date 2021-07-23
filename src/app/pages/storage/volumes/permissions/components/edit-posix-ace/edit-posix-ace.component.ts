import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PosixAclItem } from 'app/interfaces/acl.interface';

@Component({
  selector: 'app-edit-posix-ace',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditPosixAceComponent {
  @Input() selectedAce: PosixAclItem;
}
