import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {HttpClient, HttpHeaders} from "@angular/common/http";

@Component({
  selector: 'app-admin-status-detail',
  templateUrl: './status-detail.component.html',
  styleUrls: ['./status-detail.component.css']
})
export class AdminStatusDetailComponent implements OnInit {
  constructor(public dialogRef: MatDialogRef<AdminStatusDetailComponent>,@Inject(MAT_DIALOG_DATA,) public data: any, private http: HttpClient) { }

  ngOnInit() {

  }

  /**
   * closes dialog
   */
  cancel() {
    this.dialogRef.close('cancel');
  }

  deleteGroup() {
    this.dialogRef.close('delete');
  }

  /**
   * submits new / edited quiz to the server using rest api
   */
  submit(password: string) {
    if(password.length > 0){
      console.log('need to hash new pw');
      this.http.put('/api/admin/playsessions/' + this.data.playSession.session_id, {
        groupName: this.data.playSession.sessionGroupName,
      }, {headers: new HttpHeaders().set('X-Auth-Token', this.data.adminToken)}).subscribe(
        (data) => {
          this.dialogRef.close();
        },
        (err) => {
          console.log('error editing location', err);
        }
      );
    } else {
      console.log('dont need to hash new pw');
      this.http.put('/api/admin/playsessions/' + this.data.playSession.session_id, {
        password: password,
        groupName: this.data.playSession.sessionGroupName,
      }, {headers: new HttpHeaders().set('X-Auth-Token', this.data.adminToken)}).subscribe(
        (data) => {
          this.dialogRef.close();
        },
        (err) => {
          console.log('error editing location', err);
        }
      );
    }
  }
}
