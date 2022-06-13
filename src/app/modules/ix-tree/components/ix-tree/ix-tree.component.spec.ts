import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IxTreeComponent } from './ix-tree.component';

describe('IxTreeComponent', () => {
  let component: IxTreeComponent;
  let fixture: ComponentFixture<IxTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IxTreeComponent],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IxTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
