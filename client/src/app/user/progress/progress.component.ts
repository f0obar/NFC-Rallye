import {Component, Input, OnInit} from '@angular/core';
import {IntervalObservable} from 'rxjs/observable/IntervalObservable';
import {animate, keyframes, state, style, transition, trigger} from '@angular/animations';

declare const CountUp: any;

@Component({
  selector: 'app-user-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.css'],
  animations: [
    trigger('popOverState', [
      state('show', style({
        opacity: 0,
        transform: 'translateX(0px)',
      })),
      state('hide',   style({
        opacity: 0,
        transform: 'translateX(0px)',
      })),
      transition('show => hide', animate('0ms ease-out')),
      transition('hide => show',
        animate(1000, keyframes([
          style({opacity: 0, transform: 'translateX(0)', offset: 0}),
          style({opacity: 1, transform: 'translateX(25px)', offset: 0.3}),
          style({opacity: 1, transform: 'translateX(25px)', offset: 0.7}),
          style({opacity: 0, transform: 'translateX(0px)', offset: 1})
        ])))
    ])
  ]
})

export class UserProgressComponent implements OnInit {

  @Input() progressCount: number;
  @Input() progressDone: number;
  @Input() startDate: Date;
  @Input() endDate: Date;
  @Input() points: number;

  parsedTime: string;
  showPointAnimation = false;
  pointIncrease: number;



  constructor() {
    this.points = 0;
  }

  get stateName() {
    return this.showPointAnimation ? 'show' : 'hide';
  }

  ngOnInit() {
    /**
     * when the enddate is null the session is still running, so the timer has to increase every second.
     */
    if(this.endDate === null) {
      IntervalObservable.create(1000).subscribe(n => this.parsedTime = this.parseTime());
    }
    this.showPointAnimation = false;
  }

  /**
   * Increases the Points and Plays Animation and Sound.
   * @param {number} amount
   */
  increasePoints(amount: number): void{
    this.pointIncrease = amount - this.points;
    this.showPointAnimation = true;

    const numAnim = new CountUp('points', this.points, amount);
    if (!numAnim.error) {
      numAnim.start();
    } else {
      console.error(numAnim.error);
    }

    const audio = new Audio();
    audio.src = '../../assets/sounds/pointincrease.mp3';
    audio.load();
    audio.play();

    setTimeout(()=>{
      this.showPointAnimation = false;
      this.points = amount;
      console.log('Points got increased by',amount);
    }, 1000);
  }

  /**
   * parses the start/end timestamp to a time Interval.
   * Hours, Minutes and Seconds are splitted by a :
   * @returns {string}
   */
  parseTime(): string{
    if(this.startDate !== null) {

      let currentTime: Date;

      if (this.endDate !== null) {
        currentTime = new Date(this.endDate.getTime() - this.startDate.getTime());
      } else {
        currentTime = new Date((new Date().getTime() - this.startDate.getTime()));
      }
      currentTime = new Date(currentTime.getTime() + (currentTime.getTimezoneOffset() * 60 * 1000));

      let time = '(';

      if (currentTime.getHours() < 10) {
        time += '0';
        time += currentTime.getHours();
      } else {
        time += currentTime.getHours();
      }

      time += ':';

      if (currentTime.getMinutes() < 10) {
        time += '0';
        time += currentTime.getMinutes();
      } else {
        time += currentTime.getMinutes();
      }

      time += ':';

      if (currentTime.getSeconds() < 10) {
        time += '0';
        time += currentTime.getSeconds();
      } else {
        time += currentTime.getSeconds();
      }

      time += ')';
      return time;
    }
  }
}
