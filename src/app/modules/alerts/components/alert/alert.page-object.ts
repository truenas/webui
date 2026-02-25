import { Spectator } from '@ngneat/spectator';
import { byText } from '@ngneat/spectator/jest';
import { AlertComponent } from 'app/modules/alerts/components/alert/alert.component';

export class AlertPageObject {
  constructor(private spectator: Spectator<AlertComponent>) {}

  get levelElement(): HTMLElement | null {
    return this.spectator.query('.alert-level');
  }

  get messageElement(): HTMLElement | null {
    return this.spectator.query('.alert-message');
  }

  get dateTimeElement(): HTMLElement | null {
    return this.spectator.query('.alert-time');
  }

  get nodeElement(): HTMLElement | null {
    return this.spectator.query('.alert-node');
  }

  getIconName(): string | null {
    const icon = this.spectator.query('tn-icon');
    return icon?.getAttribute('name') || null;
  }

  clickDismissLink(): void {
    const link = this.spectator.query(byText('Dismiss'));
    if (!link) {
      throw new Error('Dismiss link not found');
    }
    this.spectator.click(link);
  }

  clickReopenLink(): void {
    const link = this.spectator.query(byText('Re-Open'));
    if (!link) {
      throw new Error('Re-Open link not found');
    }
    this.spectator.click(link);
  }
}
