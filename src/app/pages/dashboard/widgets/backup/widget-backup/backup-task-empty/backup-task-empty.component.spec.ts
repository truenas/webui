import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { BackupTaskEmptyComponent } from './backup-task-empty.component';

describe('BackupTaskEmptyComponent', () => {
  let spectator: Spectator<BackupTaskEmptyComponent>;
  const createComponent = createComponentFactory({
    component: BackupTaskEmptyComponent,
    providers: [
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should display loading template when isLoading is true', () => {
    spectator.setInput('isLoading', true);
    spectator.detectChanges();
    expect(spectator.query('.loading-card-content')).toExist();
    expect(spectator.query('.empty-card-content')).not.toExist();
  });

  it('should display content when isLoading is false', () => {
    spectator.setInput('isLoading', false);
    spectator.detectChanges();
    expect(spectator.query('.empty-card-content')).toExist();
    expect(spectator.query('.loading-card-content')).not.toExist();
  });

  it('should emit addCloudSyncTask event when cloud sync link is clicked', () => {
    spectator.setInput('isLoading', false);
    spectator.detectChanges();
    const spy = jest.spyOn(spectator.component.addCloudSyncTask, 'emit');
    spectator.click(spectator.query('[ixTest="cloud-sync"]')!);
    expect(spy).toHaveBeenCalled();
  });

  it('should emit addReplicationTask event when replication link is clicked', () => {
    spectator.setInput('isLoading', false);
    spectator.detectChanges();
    const spy = jest.spyOn(spectator.component.addReplicationTask, 'emit');
    spectator.click(spectator.query('[ixTest="replication"]')!);
    expect(spy).toHaveBeenCalled();
  });

  it('should emit addRsyncTask event when rsync link is clicked', () => {
    spectator.setInput('isLoading', false);
    spectator.detectChanges();
    const spy = jest.spyOn(spectator.component.addRsyncTask, 'emit');
    spectator.click(spectator.query('[ixTest="rsync"]')!);
    expect(spy).toHaveBeenCalled();
  });
});
