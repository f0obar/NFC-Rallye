import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {MatDialog, MatTableDataSource} from "@angular/material";
import {SharedSimpleDialogComponent} from "../../shared/simple-dialog/simple-dialog.component";

@Component({
  selector: 'app-user-scoreboard',
  templateUrl: './scoreboard.component.html',
  styleUrls: ['./scoreboard.component.css']
})
export class UserScoreboardComponent implements OnInit {

  @Input() winText;
  @Input() groupName;

  @Output()
  scoreboardOutput: EventEmitter<any> = new EventEmitter();

  constructor(private http: HttpClient,public dialog: MatDialog) { }


  ngOnInit() {
  }

  /**
   * deletes the local session when the user accepts the dialog
   */
  abbrechen() {
    const deleteSession = this.dialog.open(SharedSimpleDialogComponent, {data: {
      title: 'Schnitzeljagd beenden',
      message: 'Möchtest du die Schnitzeljagd wirklich beenden?',
      button1: 'JA BEENDEN',
      button2: 'Abbrechen'
    }});
    deleteSession.afterClosed().subscribe(result => {
      if(result === 'b1') {
        console.log('user deleted session');
        this.scoreboardOutput.emit();
      }
    });
  }
}
