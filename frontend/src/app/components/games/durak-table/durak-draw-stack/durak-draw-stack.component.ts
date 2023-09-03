import {Component, Input, OnInit} from '@angular/core';
import {StackDTO} from "../../../utils/dto";

@Component({
    selector: 'app-durak-draw-stack',
    templateUrl: './durak-draw-stack.component.html',
    styleUrls: ['./durak-draw-stack.component.css']
})
export class DurakDrawStackComponent implements OnInit {

    @Input() stacks?: StackDTO[];

    stackSize: number = 0;

    ngOnInit(): void {
        if (this.stacks !== undefined) {
            this.stackSize = this.stacks[0].cards.length
        }
    }

}
