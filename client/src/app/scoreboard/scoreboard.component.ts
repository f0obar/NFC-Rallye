import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {MatPaginator, MatTableDataSource} from '@angular/material';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {WebSocketService} from './services/websocket.service';
import { environment } from '../../environments/environment';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import {isNullOrUndefined} from 'util';
import {Router} from '@angular/router';

const WS_PREFIX = environment.wsPrefix;
const WS_PORT = ':44527';

@Component({
  selector: 'app-scoreboard',
  templateUrl: './scoreboard.component.html',
  styleUrls: ['./scoreboard.component.css']
})

export class ScoreboardComponent implements OnInit, AfterViewInit {

  @Input() groupName: string;

  public messages: Subject<String> = new Subject<String>();
  displayedColumns = ['name', 'points'];

  public groups: Array<Group> = [];

  // data source for the table
  dataSource = new MatTableDataSource();

  constructor(private http: HttpClient, private wsService: WebSocketService,private el: ElementRef, public router: Router) {
    const hostname = window.location.hostname;
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
  async ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    if (!isNullOrUndefined(this.groupName)) {
      await this.loadScript('../../assets/js/confetti/jquery.min.js');
      await this.loadScript('../../assets/js/confetti/confetti.js');
    }
    history.pushState(null,null,this.router.url);
    window.addEventListener('popstate', (event) => {
      history.pushState(null,null,this.router.url);
    });
  }

  private loadScript(scriptUrl: string) {
    return new Promise((resolve, reject) => {
      const scriptElement = document.createElement('script');
      scriptElement.src = scriptUrl;
      scriptElement.onload = resolve;
      document.body.appendChild(scriptElement);
    });
  }

  /**
   * parses new scoreboard data
   */
  updateScoreboard(data) {
    this.groups = [];
    for (const entry of data['sessions']) {
      this.groups.push(new Group(entry['name'], entry['points']));
    }
    this.groups.sort((n1, n2) => n2.points - n1.points);
    this.dataSource.data = this.groups;
  }

  /**
   * gets current scoreboard entries from the server
   */
  getDataFromServer() {
    this.http.get('/api/scoreboard').subscribe(
      data => {
        this.updateScoreboard(data);
      },
      (err: HttpErrorResponse) => {
      }
    );
  }

  /**
   * checks if selected group is the highlighted group
   * @param {Group} group
   * @returns {boolean}
   */
  highlightRow(group: Group): boolean{
   return this.groupName === group.name;
  }
}

export class Group {
  constructor(public name: string,
              public points: number) {
  }
}
