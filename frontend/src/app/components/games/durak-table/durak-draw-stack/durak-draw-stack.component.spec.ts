import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DurakDrawStackComponent} from './durak-draw-stack.component';

describe('DurakDrawStackComponent', () => {
    let component: DurakDrawStackComponent;
    let fixture: ComponentFixture<DurakDrawStackComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DurakDrawStackComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DurakDrawStackComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
