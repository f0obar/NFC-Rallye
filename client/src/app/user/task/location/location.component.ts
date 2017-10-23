import {Component, Input, OnInit} from '@angular/core';
import {Location} from '../../location';

@Component({
  selector: 'app-user-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.css']
})
export class UserLocationComponent implements OnInit {
  @Input() location: Location;

  constructor() { }

  ngOnInit() {
  }

}
