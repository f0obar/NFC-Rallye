import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {AdminTagDetailComponent} from './tag-detail/tag-detail.component';
import {MatDialog, MatPaginator, MatSort, MatTableDataSource} from '@angular/material';
import {AdminTag} from './admin-tag';
import {SharedSimpleDialogComponent} from '../../../shared/simple-dialog/simple-dialog.component';
import {AdminAuthService} from '../../services/admin-auth.service';
import {AdminRestService} from '../../services/admin-rest.service';
import {isNullOrUndefined} from 'util';

@Component({
  selector: 'app-admin-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.css']
})
export class AdminTagsComponent implements OnInit, AfterViewInit {

  constructor(private dialog: MatDialog,public  authService: AdminAuthService, private restService: AdminRestService) {
  }

  public tags: Array<AdminTag>;

  displayedColumns = ['tagID','alias', 'location','url', 'edit'];

  dataSource = new MatTableDataSource();
  hostname = window.location.hostname;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  ngOnInit() {
    this.loadTagsFromServer();
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


  loadTagsFromServer() {
    console.log('loading current tags from server');
    this.restService.getEntries('/api/admin/tags').subscribe(data =>{
      if(!isNullOrUndefined(data)){
        this.tags = [];
        console.log('loaded current tags', data);
        for (const d in data) {
          if (data.hasOwnProperty(d)) {
            this.tags.push(
              new AdminTag(data[d]['alias'],
                data[d]['location'],
                data[d]['tagID'],
                data[d]['_id']));
          }
        }
        this.dataSource.data = this.tags;
      }
    });
  }

  /**
   * opens new popup dialog
   */
  addTag() {
    console.log('add location');
    const edit = this.dialog.open(AdminTagDetailComponent, {
      data: {
        currentTag: null
      }
    });
    edit.afterClosed().subscribe(() => {
      this.loadTagsFromServer();
    });
  }

  /**
   * opens new popup dialog with existing tag
   * @param {AdminTag} tag
   */
  editTag(tag: AdminTag,event: any) {
    console.log('edit tag', tag._id);
    if (((event['path'])[0])['className'] !== 'mdi') {
      const edit = this.dialog.open(AdminTagDetailComponent, {
        data: {
          currentTag: tag
        }
      });
      edit.afterClosed().subscribe(() => {
        this.loadTagsFromServer();
      });
    }
  }

  deleteTag(tag: AdminTag) {
    const d = this.dialog.open(SharedSimpleDialogComponent, {
      data: {
        title: 'Quiz Löschen',
        message: 'Möchtest du wirklich diesen Tag löschen?',
        button1: 'Löschen',
        button2: 'Abbrechen'
      }
    });
    d.afterClosed().subscribe(result => {
      if (result === 'b1') {
        console.log('delete quiz', tag._id);
        this.restService.deleteEntry('/api/admin/tags/' + tag._id).subscribe(data => {
          if(data === true){
            this.loadTagsFromServer();
          }
        });
      }
    });
  }
}
