import {AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {SharedSimpleDialogComponent} from '../../../shared/simple-dialog/simple-dialog.component';
import {MatDialog, MatPaginator, MatSort, MatTableDataSource} from '@angular/material';
import {isNullOrUndefined} from 'util';
import {AdminStatusDetailComponent} from './status-detail/status-detail.component';
import {AdminAuthService} from '../../services/admin-auth.service';
import {AdminRestService} from '../../services/admin-rest.service';


@Component({
  selector: 'app-admin-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css']
})
export class AdminStatusComponent implements OnInit, AfterViewInit {
  public activePlaySessions: Array<PlaySession>;

  displayedColumns = ['name', 'location','time','lastActive','points', 'progress','edit'];

  dataSource = new MatTableDataSource();


  constructor(public dialog: MatDialog,
              private cdRef : ChangeDetectorRef,
              public  authService: AdminAuthService,
              private restService: AdminRestService) {
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
        message: 'Möchtest du wirklich alle aktiven Rallye Sessions löschen?',
        button1: 'Löschen',
        button2: 'Abbrechen'
      }
    });
    d.afterClosed().subscribe(result => {
      if (result === 'b1') {
        console.log('deleting all active sessions');
        for (let i = 0; i < this.activePlaySessions.length; i++) {
          this.deleteSession(this.activePlaySessions[i]);
        }
      }
    });
  }

  deleteSession(playSession: PlaySession) {

    this.restService.deleteEntry('/api/admin/playsessions/' + playSession.session_id).then(data => {
      for (let index = 0; index < this.activePlaySessions.length; index++) {
        if (this.activePlaySessions[index].session_id === playSession.session_id) {
          this.activePlaySessions.splice(index, 1);
        }
      }
      this.dataSource.data = this.activePlaySessions;
    }).catch(e => {
    });
  }


  deleteSessionWithDialog(playSession: PlaySession) {
    const d = this.dialog.open(SharedSimpleDialogComponent, {
      data: {
        title: 'Session Löschen',
        message: 'Möchtest du wirklich diese Session löschen?',
        button1: 'Löschen',
        button2: 'Abbrechen'
      }
    });
    d.afterClosed().subscribe(result => {
      if (result === 'b1') {
        this.deleteSession(playSession);
      }
    });
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
    this.restService.getEntries('/api/admin/playsessions').then(data => {
        this.activePlaySessions = [];
        for (const d in data) {
          if (data.hasOwnProperty(d)) {
            console.log('TEST',data[d]);
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
    }).catch(e => {
    });
  }

  openDetail(playSession: PlaySession,event: any) {
    if ((!isNullOrUndefined(event['path'])
        && ((event['path'])[0])['localName'] !== 'i')
      || ((!isNullOrUndefined(event['explicitOriginalTarget'])
        && (event['explicitOriginalTarget'])['localName'] !== 'i'))) {
      const d = this.dialog.open(AdminStatusDetailComponent, {
        data: {
          playSession: playSession
        }
      });
    }
  }

  convertInt(s: string): number {
    return parseInt(s, 10);
  }

  resolveAlias(playSessions: PlaySession[]){
    let locationNames;
    this.restService.getEntries('/api/admin/locationnames').then(data => {
        locationNames = data['locations'];
        for (const playSession of playSessions){
          playSession.setLocationAlias(locationNames[playSession.sessionLocation]);
        }
    }).catch(e => {
    });
  }
}

export class PlaySession {
  public locationAlias: string;
  constructor(public sessionGroupName: string,
              public sessionlastUpdated: Date,
              public sessionLocation: string,
              public sessionLocationCount: string,
              public sessionLocationsToVisit: Array<string>,
              public sessionRiddle: string,
              public task: string,
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
