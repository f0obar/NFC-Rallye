import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {IntervalObservable} from 'rxjs/observable/IntervalObservable';
import {MatPaginator, MatSort, MatSortHeader, MatTableDataSource} from '@angular/material';

@Component({
  selector: 'app-scoreboard',
  templateUrl: './scoreboard.component.html',
  styleUrls: ['./scoreboard.component.css']
})
export class ScoreboardComponent implements OnInit, AfterViewInit {

  constructor() { }

  displayedColumns = ['name', 'points'];

  public groups: Array<Group>;

  dataSource = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  ngOnInit() {
    IntervalObservable.create(1000).subscribe(n => this.getDataFromServer());
  }

  /**
   * Set the sort after the view init since this component will
   * be able to query its view for the initialized sort.
   */
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /**
   * gets all current playsessions from the server and puts them into the table
   */
  getDataFromServer() {
    this.groups = [];
    this.groups.push(new Group('TEAM',123));

    this.groups.sort((n1,n2) => n2.points - n1.points);
    this.dataSource.data = this.groups;
  }
}

export class Group {
  constructor(public name: string,
              public points: number) {
  }
}
