import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IxCheckboxColumnComponent } from './ix-checkbox-column.component';

describe('IxCheckboxColumnComponent', () => {
  let component: IxCheckboxColumnComponent;
  let fixture: ComponentFixture<IxCheckboxColumnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IxCheckboxColumnComponent],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IxCheckboxColumnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
