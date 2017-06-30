import {async,ComponentFixture,TestBed} from '@angular/core/testing';
import { EntityAddComponent } from './entity-add.component';
import {} from 'jasmine';
describe('EntityAddComponent', () => {
  let component: EntityAddComponent;
  let fixture: ComponentFixture<EntityAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EntityAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
