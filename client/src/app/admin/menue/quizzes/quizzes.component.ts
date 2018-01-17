import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatPaginator, MatSort, MatTableDataSource} from '@angular/material';
import {AdminQuiz} from './admin-quiz';
import {AdminQuizDetailComponent} from './quiz-detail/quiz-detail.component';
import {SharedSimpleDialogComponent} from '../../../shared/simple-dialog/simple-dialog.component';
import {AdminAuthService} from '../../services/admin-auth.service';
import {AdminRestService} from '../../services/admin-rest.service';
import {isNullOrUndefined} from "util";

@Component({
  selector: 'app-admin-quizzes',
  templateUrl: './quizzes.component.html',
  styleUrls: ['./quizzes.component.css']
})
export class AdminQuizzesComponent implements OnInit, AfterViewInit {

  displayedColumns = ['type','isActive','name', 'description','_id', 'edit'];

  dataSource = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private dialog: MatDialog,public  authService: AdminAuthService, private restService: AdminRestService) {
  }

  public quizzes: Array<AdminQuiz>;

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

  ngOnInit() {
    this.loadQuizzesFromServer();
  }

  /**
   * loads all quizzes in the database from the server to display them in the list
   */
  loadQuizzesFromServer() {
    this.restService.getEntries('/api/admin/riddles').then(data => {
      this.quizzes = [];
      for (const d in data) {
        if (data.hasOwnProperty(d)) {
          this.quizzes.push(
            new AdminQuiz(data[d]['answer'],
              data[d]['choices'],
              data[d]['description'],
              data[d]['hint'],
              data[d]['image'],
              data[d]['isActive'],
              data[d]['location'],
              data[d]['name'],
              data[d]['_id'],
              data[d]['code']));
        }
      }
      this.dataSource.data = this.quizzes;
    }).catch(e => {
    });
  }

  /**
   * opens a new popup dialog for editing a quiz.
   * Current Quiz is null and Popup dialog handles this and initializes default values.
   */
  addQuiz() {
    const edit = this.dialog.open(AdminQuizDetailComponent, {
      data: {
        currentQuiz: null
      }
    });
    edit.afterClosed().subscribe(() => {
      this.loadQuizzesFromServer();
    });
  }

  /**
   * Opens a new Popup dialog for editing a quiz.
   * @param {AdminQuiz} quiz to edit.
   */
  editQuiz(quiz: AdminQuiz,event: any) {
    // catch icon click
    if ((!isNullOrUndefined(event['path'])
        && ((event['path'])[0])['localName'] !== 'i')
      || ((!isNullOrUndefined(event['explicitOriginalTarget'])
        && (event['explicitOriginalTarget'])['localName'] !== 'i'))) {
      const edit = this.dialog.open(AdminQuizDetailComponent, {
        data: {
          currentQuiz: quiz
        }
      });
      edit.afterClosed().subscribe(() => {
        this.loadQuizzesFromServer();
      });
    }
  }

  /**
   * uses rest api to delete selected quiz in the database
   * @param {AdminQuiz} quiz to be deleted.
   */
  deleteQuiz(quiz: AdminQuiz) {
    const d = this.dialog.open(SharedSimpleDialogComponent, {
      data: {
        title: 'Rätsel Löschen',
        message: 'Möchtest du wirklich dieses Rätsel löschen?',
        button1: 'Löschen',
        button2: 'Abbrechen'
      }
    });
    d.afterClosed().subscribe(result => {
      if (result === 'b1') {
        this.restService.deleteEntry('/api/admin/riddles/' + quiz._id).then(data => {
          this.loadQuizzesFromServer();
        }).catch(e => {
        });
      }
    });
  }

  /**
   * gets a string description of the quiz
   * @param quiz
   */
  getType(quiz: AdminQuiz): string {
    if(quiz.choices.length === 0){
      return 'SA';
    } else  {
      return 'MC';
    }
  }
}
