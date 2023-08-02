import {Component, Inject, OnInit, Optional} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-join-lobby-modal',
  templateUrl: './join-lobby-modal.component.html',
  styleUrls: ['./join-lobby-modal.component.css']
})
export class JoinLobbyModalComponent implements OnInit {
  id: string

  constructor(
    public dialogRef: MatDialogRef<JoinLobbyModalComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.id = data.id
  }

  ngOnInit(): void {
  }
}
