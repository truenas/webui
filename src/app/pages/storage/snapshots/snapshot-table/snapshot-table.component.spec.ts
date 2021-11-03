import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SnapshotTableComponent } from './snapshot-table.component';

describe('SnapshotTableComponent', () => {
  let component: SnapshotTableComponent;
  let fixture: ComponentFixture<SnapshotTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SnapshotTableComponent],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SnapshotTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
