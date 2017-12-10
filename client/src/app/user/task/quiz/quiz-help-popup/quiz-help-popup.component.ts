import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

@Component({
  selector: 'app-user-quiz-help-popup',
  templateUrl: './quiz-help-popup.component.html',
  styleUrls: ['./quiz-help-popup.component.css']
})
export class UserQuizHelpPopupComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<UserQuizHelpPopupComponent>,@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
  }

}
