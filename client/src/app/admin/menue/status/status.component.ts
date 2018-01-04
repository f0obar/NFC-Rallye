import {AfterViewInit, ChangeDetectorRef, Component, Input, OnInit, ViewChild} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {SharedSimpleDialogComponent} from '../../../shared/simple-dialog/simple-dialog.component';
import {MatDialog, MatPaginator, MatSort, MatTableDataSource} from '@angular/material';
import {isNullOrUndefined} from 'util';
import {AdminStatusDetailComponent} from './status-detail/status-detail.component';


@Component({
  selector: 'app-admin-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css']
})
export class AdminStatusComponent implements OnInit, AfterViewInit {

  @Input() adminToken: string;

  public activePlaySessions: Array<PlaySession>;

  displayedColumns = ['name', 'location','time','lastActive','points', 'progress'];

  dataSource = new MatTableDataSource();


  constructor(private http: HttpClient, public dialog: MatDialog, private cdRef : ChangeDetectorRef) {
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  /**
   * Set the paginator after the view init since this component will
   * be able to query its view for the initialized paginator.
   */
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnInit() {
    this.loadSessions();
  }

  deleteActiveSessions() {
    const d = this.dialog.open(SharedSimpleDialogComponent, {
      data: {
        title: 'ALLE SESSIONS LÖSCHEN',
        message: 'Möchtest du wirklich alle aktiven Schnitzeljagd Sessions löschen?',
        button1: 'Löschen',
        button2: 'Abbrechen'
      }
    });
    d.afterClosed().subscribe(result => {
      if (result === 'b1') {
        console.log('deleting all active sessions');
        for (let i = 0; i < this.activePlaySessions.length; i++) {
          this.deleteSession(this.activePlaySessions[i].session_id);
        }
      }
    });
  }

  deleteSession(sessionID: string) {
    console.log('deleting session', sessionID);
    this.http.delete('/api/admin/playsessions/' + sessionID, {headers: new HttpHeaders().set('X-Auth-Token', this.adminToken)}).subscribe(
      (data) => {
        console.log('delete session successfull', data);
        for (let index = 0; index < this.activePlaySessions.length; index++) {
          if (this.activePlaySessions[index].session_id === sessionID) {
            this.activePlaySessions.splice(index, 1);
          }
        }
        this.dataSource.data = this.activePlaySessions;
      },
      (err) => {
        console.log('delete session error', err);
      }
    );
  }

  /**
   * for the material table search function
   * @param {string} filterValue
   */
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }

  /**
   * converts start date timestamp to the actual running time (and the complete time if there is an end date)
   * @param {PlaySession} session
   * @returns {string}
   */
  parseTimeSession(session: PlaySession): string {
    if(session.startDate !== null) {
      let currentTime: Date;

      if (session.endDate !== null) {
        currentTime = new Date(session.endDate.getTime() - session.startDate.getTime());
      } else {
        currentTime = new Date((new Date().getTime() - session.startDate.getTime()));
      }
      currentTime = new Date(currentTime.getTime() + (currentTime.getTimezoneOffset() * 60 * 1000));
      return this.parseTimeToString(currentTime);
    }
    this.cdRef.detectChanges();
    return '';
  }

  parseTimeLast(session: PlaySession): string {
    if(session.sessionlastUpdated !== null) {
      let currentTime: Date;

      currentTime = new Date((new Date().getTime() - session.sessionlastUpdated.getTime()));

      currentTime = new Date(currentTime.getTime() + (currentTime.getTimezoneOffset() * 60 * 1000));
      return this.parseTimeToString(currentTime);
    }
    this.cdRef.detectChanges();
    return '';
  }

  /**
   * converts Date to Hours-Minutes-Seconds for representation on the GUI
   * @param {Date} interval
   * @returns {string}
   */
  parseTimeToString(interval: Date): string{
      let time = '';

      if (interval.getHours() < 10) {
        time += '0';
        time += interval.getHours();
      } else {
        time += interval.getHours();
      }

      time += ':';

      if (interval.getMinutes() < 10) {
        time += '0';
        time += interval.getMinutes();
      } else {
        time += interval.getMinutes();
      }

      time += ':';

      if (interval.getSeconds() < 10) {
        time += '0';
        time += interval.getSeconds();
      } else {
        time += interval.getSeconds();
      }

      time += '';
      return time;
  }

  loadSessions() {
    console.log('loading current play sessions');
    this.http.get('/api/admin/playsessions', {headers: new HttpHeaders().set('X-Auth-Token', this.adminToken)}).subscribe(
      (data) => {
        this.activePlaySessions = [];
        for (const d in data) {
          if (data.hasOwnProperty(d)) {
            const playSession =
              new PlaySession(data[d]['groupName'],
                null,
                data[d]['location'],
                data[d]['locationCount'],
                data[d]['locationsToVisit'],
                data[d]['riddle'],
                data[d]['task'],
                data[d]['usedRiddles'],
                data[d]['_id'],
                null,
                null,
                data[d]['points']);


            if(!isNullOrUndefined(data[d]['startDate'])){
              playSession.startDate = new Date(data[d]['startDate']);
            }
            if(!isNullOrUndefined(data[d]['endDate'])){
              playSession.endDate = new Date(data[d]['endDate']);
            }
            if(!isNullOrUndefined(data[d]['lastUpdated'])){
              playSession.sessionlastUpdated = new Date(data[d]['lastUpdated']);
            }
            this.activePlaySessions.push(playSession);
          }
        }
        /**
         * add current location to the locations the user has to visit if it hasn't been found already.
         */
        for (const playSession of this.activePlaySessions){
          if(playSession.task === 'findLocation'){
            playSession.sessionLocationsToVisit.push(playSession.sessionLocation);
          }
        }
        this.resolveAlias(this.activePlaySessions);
        this.dataSource.data = this.activePlaySessions;
        console.log('current play sessions', this.activePlaySessions);
      },
      (err) => {
        console.log('current play sessions error', err);
      }
    );
  }

  openDetail(playSession: PlaySession) {
    const d = this.dialog.open(AdminStatusDetailComponent, {
      data: {
        playSession: playSession,
        adminToken: this.adminToken
      }
    });
    d.afterClosed().subscribe(result => {
      if (result === 'delete') {
       console.log('deleting playsession');
       this.deleteSession(playSession.session_id);
      }
    });
  }

  convertInt(s: string): number {
    return parseInt(s, 10);
  }

  resolveAlias(playSessions: PlaySession[]){
    let locationNames;

    this.http.get('/api/admin/locationnames', {headers: new HttpHeaders().set('X-Auth-Token', this.adminToken)}).subscribe(
      (data) => {
        locationNames = data['locations'];
        for (const playSession of playSessions){
          playSession.setLocationAlias(locationNames[playSession.sessionLocation]);
        }
      },
      (err) => {
        console.log('current play sessions error', err);
      }
    );
  }
}

export class PlaySession {
  public locationAlias: string;
  constructor(public sessionGroupName: string,
              public sessionlastUpdated: Date,
              public sessionLocation: string,
              public sessionLocationCount: string,
              public sessionLocationsToVisit: Array<string>,
              public sessionRiddle: string, public task: string,
              public sessionUsedRiddles: Array<string>,
              public session_id: string,
              public startDate: Date,
              public endDate: Date,
              public points: number) {
  }
  public setLocationAlias(s: string){
    this.locationAlias = s;
  }
}
