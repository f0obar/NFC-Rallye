import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {MatDialog, MatTableDataSource} from '@angular/material';
import {SharedSimpleDialogComponent} from '../../shared/simple-dialog/simple-dialog.component';
import {UserDialogService} from '../services/user-dialog.service';

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

  constructor(private http: HttpClient,public dialog: MatDialog,private dialogService: UserDialogService) { }


  ngOnInit() {
  }

  /**
   * deletes the local session when the user accepts the dialog
   */
  abbrechen() {
    const deleteSession = this.dialogService.open(SharedSimpleDialogComponent, {data: {
      title: 'Rallye beenden',
      message: 'Möchtest du die Rallye wirklich beenden?',
      button1: 'Ja beenden',
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
