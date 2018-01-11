import { Component, OnInit } from '@angular/core';
import {} from '@angular/common/http';
import {AdminAuthService} from './services/admin-auth.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {

  constructor(public  authService: AdminAuthService) {
  }

  /**
   * checks local storage for an old admin token
   */
  ngOnInit() {}

}
