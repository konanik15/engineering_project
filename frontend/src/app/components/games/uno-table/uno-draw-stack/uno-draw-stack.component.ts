import {Component, Input, OnInit} from '@angular/core';
import {StackDTO} from '../../../utils/dto'
@Component({
  selector: 'app-uno-draw-stack',
  templateUrl: './uno-draw-stack.component.html',
  styleUrls: ['./uno-draw-stack.component.css']
})
export class UnoDrawStackComponent implements OnInit {

  @Input() stacks?: StackDTO[];

  stackSize :number = 0;

  ngOnInit(): void {
    console.log(this.stacks)
    if(this.stacks !== undefined){
      this.stackSize = this.stacks[0].cards.length
    }
  }



}
