import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {AdminLocationDetailComponent} from './location-detail/location-detail.component';
import {MatDialog, MatPaginator, MatSort, MatTableDataSource} from '@angular/material';
import {AdminLocation} from './admin-location';
import {SharedSimpleDialogComponent} from "../../../shared/simple-dialog/simple-dialog.component";
import {UserLocationMapPopupComponent} from "../../../shared/map/location-map-popup.component";

@Component({
  selector: 'app-admin-locations',
  templateUrl: './locations.component.html',
  styleUrls: ['./locations.component.css']
})
export class AdminLocationsComponent implements OnInit, AfterViewInit {

  @Input() adminToken: string;

  constructor(private http: HttpClient, private dialog: MatDialog) {
  }

  public locations : Array<AdminLocation>;

  displayedColumns = ['isActive','name', 'description','id', 'edit'];

  dataSource = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  ngOnInit() {
    this.loadLocationsFromServer();
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
   * Set the paginator after the view init since this component will
   * be able to query its view for the initialized paginator.
   */
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /**
   * loads all locations from the server
   */
  loadLocationsFromServer() {
    console.log('loading current locations from server');
    this.http.get('/api/admin/locations', {headers: new HttpHeaders().set('X-Auth-Token', this.adminToken)}).subscribe(
      (data) => {
        this.locations = [];
        console.log('loaded current locations', data);
        for (const d in data) {
          if (data.hasOwnProperty(d)) {
            this.locations.push(
              new AdminLocation(data[d]['description'],
                data[d]['image'],
                data[d]['isActive'],
                data[d]['name'],
                data[d]['_id'],
                data[d]['lat'],
                data[d]['lng'],
                data[d]['lvl']+''));
          }
        }
        this.dataSource.data = this.locations;
        console.log('initialized array', this.locations);
      },
      (err) => {
        console.log('loaded current locations error', err);
      }
    );
  }

  /**
   * opens a new popup dialog
   */
  addLocation() {
    console.log('add location');
    const edit = this.dialog.open(AdminLocationDetailComponent, {
      data: {
        currentLocation: null,
        adminToken: this.adminToken
      }
    });
    edit.afterClosed().subscribe(() => {
      this.loadLocationsFromServer();
    });
  }

  openMap(location: AdminLocation) {
    const d = this.dialog.open(UserLocationMapPopupComponent, {
      panelClass: 'app-full-bleed-dialog',
      maxWidth: '98vw',
      data: {
        location: location,
        admin: true,
        adminToken: this.adminToken
      }
    });
    d.afterClosed().subscribe(() => {
      this.loadLocationsFromServer();
    });
  }

  /**
   * opens a new popup dialog with an existing location
   * @param {AdminLocation} location
   */
  editLocation(location: AdminLocation) {
    console.log('edit location', location._id);
    const edit = this.dialog.open(AdminLocationDetailComponent, {
      data: {
        currentLocation: location,
        adminToken: this.adminToken
      }
    });
    edit.afterClosed().subscribe(() => {
      this.loadLocationsFromServer();
    });
  }

  /**
   * deletes a location from the database.
   * @param {AdminLocation} location
   */
  deleteLocation(location: AdminLocation) {
    const d = this.dialog.open(SharedSimpleDialogComponent, {
      data: {
        title: 'Location Löschen',
        message: 'Möchtest du wirklich diese Location löschen?',
        button1: 'Löschen',
        button2: 'Abbrechen'
      }
    });
    d.afterClosed().subscribe(result => {
      if (result === 'b1') {
        console.log('delete location', location._id);
        this.http.delete('/api/admin/locations/' + location._id, {headers: new HttpHeaders().set('X-Auth-Token', this.adminToken)}).subscribe(
          () => {
            console.log('successfully deleted location', location._id);
            this.loadLocationsFromServer();
          },
          (err) => {
            console.log('error deleting location', err);
          }
        );
      }
    });
  }
}
