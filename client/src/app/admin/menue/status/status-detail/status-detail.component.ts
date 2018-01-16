import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {AdminAuthService} from '../../../services/admin-auth.service';
import {AdminRestService} from '../../../services/admin-rest.service';

@Component({
  selector: 'app-admin-status-detail',
  templateUrl: './status-detail.component.html',
  styleUrls: ['./status-detail.component.css']
})
export class AdminStatusDetailComponent implements OnInit {
  constructor(public dialogRef: MatDialogRef<AdminStatusDetailComponent>,@Inject(MAT_DIALOG_DATA,) public data: any,public  authService: AdminAuthService, private restService: AdminRestService) { }

  ngOnInit() {

  }

  /**
   * closes dialog
   */
  cancel() {
    this.dialogRef.close('cancel');
  }

  /**
   * submits new / edited quiz to the server using rest api
   */
  submit(password: string) {
    if(password.length > 0){
      this.restService.saveExistingEntry('/api/admin/playsessions/' + this.data.playSession.session_id,{
        password: password,
        groupName: this.data.playSession.sessionGroupName,
      }).then(data => {
          this.dialogRef.close();
      }).catch(e => {
      });
    } else {
      this.restService.saveExistingEntry('/api/admin/playsessions/' + this.data.playSession.session_id,{
        groupName: this.data.playSession.sessionGroupName
      }).then(data => {
          this.dialogRef.close();
      }).catch(e => {
      });
    }
  }
}
