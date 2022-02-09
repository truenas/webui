import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SnapshotBatchDeleteDialogComponent } from './snapshot-batch-delete-dialog.component';

describe('SnapshotBatchDeleteDialogComponent', () => {
  let component: SnapshotBatchDeleteDialogComponent;
  let fixture: ComponentFixture<SnapshotBatchDeleteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SnapshotBatchDeleteDialogComponent],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SnapshotBatchDeleteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
