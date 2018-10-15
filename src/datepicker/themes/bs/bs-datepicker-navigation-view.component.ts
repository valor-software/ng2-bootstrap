import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import {
  BsDatepickerViewMode,
  BsNavigationDirection,
  DaysCalendarViewModel
} from '../../models/index';
import { BsDatepickerConfig } from '../../bs-datepicker.config';

@Component({
  selector: 'bs-datepicker-navigation-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button class="previous"
            [disabled]="calendar.disableLeftArrow"
            [style.visibility]="calendar.hideLeftArrow ? 'hidden' : 'visible'"
            (click)="navTo(true)"><span>&lsaquo;</span>
    </button>

    <button class="current"
            *ngIf="calendar.monthTitle && !config.disableMonthView"
            (click)="view('month')"
    ><span>{{ calendar.monthTitle }}</span>
    </button>
    <div class="current"
            *ngIf="calendar.monthTitle && config.disableMonthView"
    ><span>{{ calendar.monthTitle }}</span>
    </div>

    <button class="current" (click)="view('year')" *ngIf="!config.disableYearView"
    ><span>{{ calendar.yearTitle }}</span></button>
    <div class="current" *ngIf="config.disableYearView"><span>{{ calendar.yearTitle }}</span></div>

    <button class="next"
            [disabled]="calendar.disableRightArrow"
            [style.visibility]="calendar.hideRightArrow ? 'hidden' : 'visible'"
            (click)="navTo(false)"><span>&rsaquo;</span>
    </button>
  `
})
export class BsDatepickerNavigationViewComponent {
  @Input() calendar: DaysCalendarViewModel;

  @Output() onNavigate = new EventEmitter<BsNavigationDirection>();
  @Output() onViewMode = new EventEmitter<BsDatepickerViewMode>();

  navTo(down: boolean): void {
    this.onNavigate.emit(
      down ? BsNavigationDirection.DOWN : BsNavigationDirection.UP
    );
  }

  config: BsDatepickerConfig;
  view(viewMode: BsDatepickerViewMode): void {
    if(viewMode != 'year' || !this.config.disableYearView) {
      if(viewMode != 'month' || !this.config.disableMonthView) {
        this.onViewMode.emit(viewMode);
      }   
    }    
  }

  constructor(private _config: BsDatepickerConfig){
    this.config = _config;
  }
}
