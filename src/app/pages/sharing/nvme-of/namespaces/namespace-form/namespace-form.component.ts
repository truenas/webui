import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';

@Component({
  selector: 'ix-namespace-form',
  templateUrl: './namespace-form.component.html',
  styleUrl: './namespace-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class NamespaceFormComponent {
  constructor(
    public slideInRef: SlideInRef<NvmeOfNamespace | undefined, false | NvmeOfNamespace>,
  ) {}
}
