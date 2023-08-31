import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnoDrawStackComponent } from './uno-draw-stack.component';

describe('UnoDrawStackComponent', () => {
  let component: UnoDrawStackComponent;
  let fixture: ComponentFixture<UnoDrawStackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnoDrawStackComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnoDrawStackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
