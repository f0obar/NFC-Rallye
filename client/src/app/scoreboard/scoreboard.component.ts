import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {IntervalObservable} from 'rxjs/observable/IntervalObservable';
import {MatPaginator, MatSort, MatSortHeader, MatTableDataSource} from '@angular/material';
import {HttpClient, HttpErrorResponse} from "@angular/common/http";

@Component({
  selector: 'app-scoreboard',
  templateUrl: './scoreboard.component.html',
  styleUrls: ['./scoreboard.component.css']
})
export class ScoreboardComponent implements OnInit, AfterViewInit {

  constructor(private http: HttpClient) { }

  displayedColumns = ['name', 'points'];

  public groups: Array<Group>;

  dataSource = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngOnInit() {
    this.getDataFromServer();
    IntervalObservable.create(5000).subscribe(n => this.getDataFromServer());
  }

  /**
   * Set the sort after the view init since this component will
   * be able to query its view for the initialized sort.
   */
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
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
}

export class Group {
  constructor(public name: string,
              public points: number) {
  }
}
