import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {MatPaginator, MatTableDataSource} from '@angular/material';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {WebSocketService} from './services/websocket.service';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';

const WS_PREFIX = 'ws://';
const WS_PORT = ':44527'

@Component({
  selector: 'app-scoreboard',
  templateUrl: './scoreboard.component.html',
  styleUrls: ['./scoreboard.component.css']
})
export class ScoreboardComponent implements OnInit, AfterViewInit {

  public messages: Subject<String> = new Subject<String>();
  displayedColumns = ['name', 'points'];

  public groups: Array<Group> = [];

  dataSource = new MatTableDataSource();

  constructor(private http: HttpClient, private wsService: WebSocketService, private window: Window) {
    const hostname = this.window.location.hostname;
    this.messages = <Subject<String>>this.wsService
      .connect(WS_PREFIX + hostname + WS_PORT)
      .map((response: MessageEvent): String => {
        return JSON.parse(response.data);
    });

    this.messages.subscribe(data => {
      this.updateScoreboard(data);
    });
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngOnInit() {
    this.getDataFromServer();
  }

  /**
   * Set the sort after the view init since this component will
   * be able to query its view for the initialized sort.
   */
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  /**
   * gets all current playSessions from the server and puts them into the table
   */
  updateScoreboard(data) {
    this.groups = [];
    for (const entry of data['sessions']) {
      this.groups.push(new Group(entry['name'], entry['points']));
    }
    this.groups.sort((n1, n2) => n2.points - n1.points);
    this.dataSource.data = this.groups;
  }

  getDataFromServer() {
    this.http.get('/api/scoreboard').subscribe(
      data => {
        this.updateScoreboard(data);
      },
      (err: HttpErrorResponse) => {
        console.log('session expired', err);
      }
    );
  }
}

export class Group {
  constructor(public name: string,
              public points: number) {
  }
}
