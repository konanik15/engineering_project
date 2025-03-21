import {ComponentFixture, TestBed} from '@angular/core/testing';

import {GameTableComponent} from './game-table.component';

describe('TableComponent', () => {
  let component: GameTableComponent;
  let fixture: ComponentFixture<GameTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GameTableComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(GameTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
