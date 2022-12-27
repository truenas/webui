import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'ix-certificate-summary',
  templateUrl: './certificate-summary.component.html',
  styleUrls: ['./certificate-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateSummaryComponent {
  @Output() submitPressed = new EventEmitter<void>();

  onSubmit(): void {
    this.submitPressed.emit();
  }
}
