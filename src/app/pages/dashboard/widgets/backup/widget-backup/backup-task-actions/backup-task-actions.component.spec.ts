import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { BackupTaskActionsComponent } from './backup-task-actions.component';

describe('BackupTaskActionsComponent', () => {
  let spectator: Spectator<BackupTaskActionsComponent>;
  const createComponent = createComponentFactory({
    component: BackupTaskActionsComponent,
    providers: [
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should display backup options when allCount is positive', () => {
    spectator.setInput('allCount', 1);
    spectator.detectChanges();
    expect(spectator.query('.backup-action')).toExist();
  });

  it('should not display backup options when allCount is zero or undefined', () => {
    spectator.setInput('allCount', 0);
    spectator.detectChanges();
    expect(spectator.query('.backup-action')).not.toExist();
  });

  it('should emit addCloudSyncTask event when cloud backup link is clicked', () => {
    spectator.setInput('allCount', 1);
    spectator.detectChanges();
    const spy = jest.spyOn(spectator.component.addCloudSyncTask, 'emit');
    spectator.click(spectator.query('[ixTest="cloud"]')!);
    expect(spy).toHaveBeenCalled();
  });

  it('should emit addReplicationTask event when TrueNAS backup link is clicked', () => {
    spectator.setInput('allCount', 1);
    spectator.detectChanges();
    const spy = jest.spyOn(spectator.component.addReplicationTask, 'emit');
    spectator.click(spectator.query('[ixTest="another-TrueNAS"]')!);
    expect(spy).toHaveBeenCalled();
  });
});
