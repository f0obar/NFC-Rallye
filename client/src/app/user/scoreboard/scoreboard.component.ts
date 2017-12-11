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

  constructor(private http: HttpClient, public dialog: MatDialog) { }

  displayedColumns = ['name', 'points'];

  public groups: Array<Group>;

  dataSource = new MatTableDataSource();

  ngOnInit() {
    this.getDataFromServer();
  }

  /**
   * gets all current playsessions from the server and puts them into the table
   */
  getDataFromServer() {
    this.groups = [];

    this.http.get('/api/scoreboard').subscribe(
      data => {
        for(let entry of data['sessions']){
          this.groups.push(new Group(entry['name'],entry['points']));
        }
        this.groups.sort((n1,n2) => n2.points - n1.points);
        this.dataSource.data = this.groups;
      },
      (err: HttpErrorResponse) => {
        console.log('session expired',err);
      }
    );
  }

  isMyGroup(s: string): boolean {
    return s === this.groupName;
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

export class Group {
  constructor(public name: string,
              public points: number) {
  }
}
