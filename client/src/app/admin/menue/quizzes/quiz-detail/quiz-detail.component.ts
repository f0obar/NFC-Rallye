import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {AdminLocation} from '../../locations/admin-location';
import {MAT_DIALOG_DATA, MatDialogRef, MatSnackBar, MatSlideToggle} from '@angular/material';
import {AdminQuiz} from '../admin-quiz';
import {isNullOrUndefined} from 'util';
import {AdminAuthService} from '../../../services/admin-auth.service';
import {AdminRestService} from '../../../services/admin-rest.service';

@Component({
  selector: 'app-admin-quiz-detail',
  templateUrl: './quiz-detail.component.html',
  styleUrls: ['./quiz-detail.component.css']
})
export class AdminQuizDetailComponent implements OnInit {
  type: string;
  pageHeader: string;
  createNewEntry: boolean;
  locations: Array<AdminLocation>;
  selectedAnswerIndex: number;

  @ViewChild('slider')
  slider: MatSlideToggle;

  constructor(public dialogRef: MatDialogRef<AdminQuizDetailComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              public snackBar: MatSnackBar,
              public  authService: AdminAuthService,
              private restService: AdminRestService) {
  }

  ngOnInit() {
    if (this.data.currentQuiz != null) {
      this.pageHeader = 'Vorhandenes Quiz Bearbeiten';
      this.createNewEntry = false;
    } else {
      this.loadDefaults();
      this.pageHeader = 'Neues Quiz Hinzufügen';
      this.createNewEntry = true;
    }
    this.loadLocations();
    if (this.data.currentQuiz.choices.length !== 0) {
      this.type = 'multipleChoice';
      this.slider.toggle();

      if (!isNullOrUndefined(this.data.currentQuiz.answer) && this.data.currentQuiz.answer !== '') {
        // for upgrading old quizzes that might have an answer but the answer isn't in the available choices
        if (this.data.currentQuiz.choices.indexOf(this.data.currentQuiz.answer, 0) < 0) {
          this.data.currentQuiz.choices.push(this.data.currentQuiz.answer);
        }
        this.selectedAnswerIndex = this.data.currentQuiz.choices.indexOf(this.data.currentQuiz.answer, 0);
      }
    } else {
      this.type = 'singleAnswer';
    }
  }

  /**
   * initializes quiz with default values for adding a new singleanswer quiz.
   */
  loadDefaults() {
    this.data.currentQuiz = new AdminQuiz('sample answer',
      [],
      'sample description',
      'sample hint',
      null,
      false,
      null,
      'sample name',
      'sample id',
      '');
  }

  /**
   * removes specified choice from the array
   */
  removeChoice(choice: string) {
    const index = this.data.currentQuiz.choices.indexOf(choice, 0);
    if (this.selectedAnswerIndex === index) {
      this.selectedAnswerIndex = null;
    }
    if (index > -1) {
      this.data.currentQuiz.choices.splice(index, 1);
    }
  }

  trackByFn(index, item) {
    return index;
  }

  /**
   * adds a choice to the array
   */
  addChoice() {
    this.data.currentQuiz.choices.push('');
  }

  /**
   * loads locations from server to populate the list of locations in the dialog to select corresponding location
   */
  loadLocations() {
    this.restService.getEntries('/api/admin/locations').then(data => {
        this.locations = [];
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
                data[d]['lvl'] + ''));
          }
        }
    }).catch(e => {
    });
  }

  /**
   * submits new / edited quiz to the server using rest api
   */
  submit() {
    if (this.type === 'multipleChoice') {
      if (!isNullOrUndefined(this.selectedAnswerIndex) &&
        this.selectedAnswerIndex > -1 && this.selectedAnswerIndex < this.data.currentQuiz.choices.length) {
        this.data.currentQuiz.answer = this.data.currentQuiz.choices[this.selectedAnswerIndex];
        this.data.currentQuiz.hint = '';
      } else {
        this.snackBar.open('Keine Antwort eingegeben!', null, {
          duration: 2000,
          horizontalPosition: 'center'
        });
        return;
      }
    }
    if (this.createNewEntry === false) {
      this.restService.saveExistingEntry('/api/admin/riddles/' + this.data.currentQuiz._id,{
        answer: this.data.currentQuiz.answer,
        choices: this.data.currentQuiz.choices,
        description: this.data.currentQuiz.description,
        hint: this.data.currentQuiz.hint,
        name: this.data.currentQuiz.name,
        _id: this.data.currentQuiz._id,
        location: this.data.currentQuiz.location,
        isActive: this.data.currentQuiz.isActive,
        image: this.data.currentQuiz.image,
        code: this.data.currentQuiz.code
      }).then(data => {
          this.dialogRef.close();
      }).catch(e => {
      });
    } else {
      this.restService.saveNewEntry('/api/admin/riddles',{
        answer: this.data.currentQuiz.answer,
        choices: this.data.currentQuiz.choices,
        description: this.data.currentQuiz.description,
        hint: this.data.currentQuiz.hint,
        name: this.data.currentQuiz.name,
        location: this.data.currentQuiz.location,
        isActive: this.data.currentQuiz.isActive,
        image: this.data.currentQuiz.image,
        code: this.data.currentQuiz.code
      }).then(data => {
        this.dialogRef.close();
      }).catch(e => {
      });
    }
  }

  /**
   * closes dialog
   */
  cancel() {
    this.dialogRef.close();
  }

  /**
   * parses by user selected image file
   * @param evt
   */
  handleFileSelect(evt) {
    const files = evt.target.files;
    const file = files[0];

    this.data.currentQuiz.image = new Object();
    this.data.currentQuiz.image.filename = file.name;
    this.data.currentQuiz.image.filesize = file.size;
    this.data.currentQuiz.image.filetype = file.type;

    if (files && file) {
      const reader = new FileReader();
      reader.onload = this._handleReaderLoaded.bind(this);
      reader.readAsBinaryString(file);
    }
  }

  _handleReaderLoaded(readerEvt) {
    const binaryString = readerEvt.target.result;
    this.data.currentQuiz.image.base64 = btoa(binaryString);
  }

  /**
   * converts singleanswer quiz to multiplechoice
   */
  convertToMultipleChoice() {
    this.data.currentQuiz.choices = [];
    this.data.currentQuiz.choices.push(this.data.currentQuiz.answer);
    this.type = 'multipleChoice';
    this.selectedAnswerIndex = 0;
  }

  /**
   * converts multiplechoice quiz to singleanswer
   */
  convertToSingleAnswer() {
    this.data.currentQuiz.choices = [];
    this.type = 'singleAnswer';
  }

  /**
   * handles mc/singleanswer toggle switch
   * @param {boolean} mc
   */
  changeType(mc: boolean) {
    if (mc && this.type !== 'multipleChoice') {
      this.convertToMultipleChoice();
    }
    if (!mc && this.type !== 'singleAnswer') {
      this.convertToSingleAnswer();
    }
  }

  deleteImage(){
    this.data.currentQuiz.image = null;
  }

  /**
   * checks if there is a valid image
   */
  isImageAvailable(): boolean {
    return !isNullOrUndefined(this.data.currentQuiz.image) &&
      !isNullOrUndefined(this.data.currentQuiz.image.filetype) && this.data.currentQuiz.image.filetype !== '';
  }
}
