import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IxExpandToggleColumnComponent } from './ix-expand-toggle-column.component';

describe('IxExpandToggleColumnComponent', () => {
  let component: IxExpandToggleColumnComponent;
  let fixture: ComponentFixture<IxExpandToggleColumnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IxExpandToggleColumnComponent],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IxExpandToggleColumnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
