import { Injectable } from '@angular/core';
import {MatDialog, MatSnackBar} from '@angular/material';

@Injectable()
export class UserDialogService {

  constructor(private dialog: MatDialog,private snackBar: MatSnackBar) { }

  public open(component: any,config: any): any {
    console.log('it should work');
    this.dialog.closeAll();
    this.snackBar.dismiss();
    try {
      document.getElementsByClassName('mat-snack-bar-container').item(0).setAttribute('style', 'opacity:0');
    } catch (e){}
    document.getElementsByClassName('page-footer').item(0).setAttribute('style','z-index:100');
    const theDialog = this.dialog.open(component, config);
    theDialog.afterClosed().subscribe(() =>{
      document.getElementsByClassName('page-footer').item(0).setAttribute('style','z-index:2000');
      try {
        document.getElementsByClassName('mat-snack-bar-container').item(0).setAttribute('style', 'opacity:1');
      } catch (e){}
    });
    return theDialog;
  }
}
