import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

@Component({
  selector: 'app-shared-simple-dialog',
  templateUrl: './simple-dialog.component.html',
  styleUrls: ['./simple-dialog.component.css']
})
/**
 * Mock Dialog for usage in User and Admin page. Displays a Header, a Description and two buttons which can be assigned by data injection.
 */
export class SharedSimpleDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<SharedSimpleDialogComponent>,@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit() {
  }

  public button1Pressed(): void {
    this.dialogRef.close('b1');
  }
  public button2Pressed(): void {
    this.dialogRef.close('b2');
  }
}
