import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageDiskSedDialogComponent } from './manage-disk-sed-dialog.component';

describe('ManageDiskSedDialogComponent', () => {
  let component: ManageDiskSedDialogComponent;
  let fixture: ComponentFixture<ManageDiskSedDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManageDiskSedDialogComponent],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageDiskSedDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
