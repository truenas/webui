import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  createComponentFactory, mockProvider, Spectator, SpectatorFactory,
} from '@ngneat/spectator/jest';
import { ServicesToBeRestartedDialogComponent } from './services-to-be-restarted-dialog.component';

const mockDialogData = {
  restart_services: ['cifs', 'nfs'],
  stop_services: ['docker'],
};

describe('ServicesToBeRestartedDialogComponent', () => {
  let spectator: Spectator<ServicesToBeRestartedDialogComponent>;

  const createComponent: SpectatorFactory<ServicesToBeRestartedDialogComponent> = createComponentFactory({
    component: ServicesToBeRestartedDialogComponent,
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('displays the list of services to be restarted and stopped', () => {
    const content = spectator.query('.message-content');
    expect(content).toContainText('These services must be stopped to export the pool:');
    expect(content).toContainText('docker');
    expect(content).toContainText('These services must be restarted to export the pool:');
    expect(content).toContainText('cifs');
    expect(content).toContainText('nfs');
  });
});
