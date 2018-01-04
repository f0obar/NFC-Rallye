import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {MatDialog, MatPaginator, MatSort, MatTableDataSource} from '@angular/material';
import {AdminQuiz} from './admin-quiz';
import {AdminQuizDetailComponent} from './quiz-detail/quiz-detail.component';
import {SharedSimpleDialogComponent} from "../../../shared/simple-dialog/simple-dialog.component";

@Component({
  selector: 'app-admin-quizzes',
  templateUrl: './quizzes.component.html',
  styleUrls: ['./quizzes.component.css']
})
export class AdminQuizzesComponent implements OnInit, AfterViewInit {
  @Input() adminToken: string;

  displayedColumns = ['type','isActive','name', 'description','_id', 'edit'];

  dataSource = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private http: HttpClient, private dialog: MatDialog) {
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
    console.log('loading current quizzes from server');
    this.http.get('/api/admin/riddles', {headers: new HttpHeaders().set('X-Auth-Token', this.adminToken)}).subscribe(
      (data) => {
        this.quizzes = [];
        console.log('loaded current quizzes', data);
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
                data[d]['_id']));
          }
        }
        this.dataSource.data = this.quizzes;
        console.log('initialized array', this.quizzes);
      },
      (err) => {
        console.log('loaded current quizzes error', err);
      }
    );
  }

  /**
   * opens a new popup dialog for editing a quiz.
   * Current Quiz is null and Popup dialog handles this and initializes default values.
   */
  addQuiz() {
    console.log('add quiz');
    const edit = this.dialog.open(AdminQuizDetailComponent, {
      data: {
        currentQuiz: null,
        adminToken: this.adminToken
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
    console.log('edit quiz', quiz._id);
    // catch icon click
    if (((event['path'])[0])['className'] !== 'material-icons') {
      const edit = this.dialog.open(AdminQuizDetailComponent, {
        data: {
          currentQuiz: quiz,
          adminToken: this.adminToken
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
        title: 'Quiz Löschen',
        message: 'Möchtest du wirklich dieses Quiz löschen?',
        button1: 'Löschen',
        button2: 'Abbrechen'
      }
    });
    d.afterClosed().subscribe(result => {
      if (result === 'b1') {
        console.log('delete quiz', quiz._id);
        this.http.delete('/api/admin/riddles/' + quiz._id, {headers: new HttpHeaders().set('X-Auth-Token', this.adminToken)}).subscribe(
          () => {
            console.log('successfully deleted quiz', quiz._id);
            this.loadQuizzesFromServer();
          },
          (err) => {
            console.log('error deleting quiz', err);
          }
        );
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
