/* tslint:disable: max-file-line-count */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ValidationErrors
} from '@angular/forms';

import { getControlsValue } from './timepicker-controls.util';
import { TimepickerActions } from './reducer/timepicker.actions';
import { TimepickerConfig } from './timepicker.config';
import { TimepickerStore } from './reducer/timepicker.store';
import {
  TimeChangeSource,
  TimepickerComponentState,
  TimepickerControls
} from './timepicker.models';
import {
  isInputValid,
  isValidDate,
  padNumber,
  parseTime
} from './timepicker.utils';
import {
  compose,
  getlimitsValidator,
  hoursValidator,
  minutesValidator,
  secondsValidator
} from './input.validator';

import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

export const TIMEPICKER_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  // tslint:disable-next-line
  useExisting: forwardRef(() => TimepickerComponent),
  multi: true
};

@Component({
  selector: 'timepicker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TIMEPICKER_CONTROL_VALUE_ACCESSOR, TimepickerStore],
  templateUrl: './timepicker.component.html',
  styleUrls: ['./timepicker.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TimepickerComponent
  implements ControlValueAccessor,
    OnChanges,
    OnDestroy,
    TimepickerComponentState,
    TimepickerControls {

  @ViewChild('hoursRef') hoursRef: ElementRef;
  @ViewChild('minutesRef') minutesRef: ElementRef;
  @ViewChild('secondsRef') secondsRef: ElementRef;

  /** hours change step */
  @Input() hourStep: number;
  /** hours change step */
  @Input() minuteStep: number;
  /** seconds change step */
  @Input() secondsStep: number;
  /** if true hours and minutes fields will be readonly */
  @Input() readonlyInput: boolean;
  /** if true hours and minutes fields will be disabled */
  @Input() disabled: boolean;
  /** if true scroll inside hours and minutes inputs will change time */
  @Input() mousewheel: boolean;
  /** if true the values of hours and minutes can be changed using the up/down arrow keys on the keyboard */
  @Input() arrowkeys: boolean;
  /** if true spinner arrows above and below the inputs will be shown */
  @Input() showSpinners: boolean;
  /** if true meridian button will be shown */
  @Input() showMeridian: boolean;
  /** show minutes in timepicker */
  @Input() showMinutes: boolean;
  /** show seconds in timepicker */
  @Input() showSeconds: boolean;
  /** meridian labels based on locale */
  @Input() meridians: string[];
  /** minimum time user can select */
  @Input() min: Date;
  /** maximum time user can select */
  @Input() max: Date;

  /** emits true if value is a valid date */
  @Output() isValid = new EventEmitter<boolean>();

  // ui variables
  hours = '';
  minutes = '';
  seconds = '';
  meridian = 'AM';

  errors: ValidationErrors = {};

  /** @deprecated - please use `isEditable` instead */
  get isSpinnersVisible(): boolean {
    return this.showSpinners && !this.readonlyInput;
  }

  get isEditable(): boolean {
    return !(this.readonlyInput || this.disabled);
  }

  // time picker controls state
  canIncrementHours: boolean;
  canIncrementMinutes: boolean;
  canIncrementSeconds: boolean;

  canDecrementHours: boolean;
  canDecrementMinutes: boolean;
  canDecrementSeconds: boolean;

  canToggleMeridian: boolean;

  timepickerSub: Subscription;

  // control value accessor methods
  onChange: any = Function.prototype;
  onTouched: any = Function.prototype;


  constructor(
    _config: TimepickerConfig,
    changeDetection: ChangeDetectorRef,
    private _renderer: Renderer2,
    private _store: TimepickerStore,
    private _timepickerActions: TimepickerActions
  ) {
    Object.assign(this, _config);

    this.timepickerSub = this._store
      .select(state => state.value)
      .pipe(filter(Boolean))
      .subscribe((value: Date) => {
        // update UI values if date changed
        this._renderTime(value);
        this.onChange(value);
        this.errors = null;

        this._store.dispatch(
          this._timepickerActions.updateControls(getControlsValue(this))
        );
      });

    this._store
      .select(state => state.controls)
      .subscribe((controlsState: TimepickerControls) => {
        this.isValid.emit(isInputValid(this.hours, this.minutes, this.seconds));
        Object.assign(this, controlsState);
        changeDetection.markForCheck();
      });
  }

  isPM(): boolean {
    return this.showMeridian && this.meridian === this.meridians[1];
  }

  prevDef($event: any) {
    $event.preventDefault();
  }

  wheelSign($event: any): number {
    return Math.sign($event.deltaY as number) * -1;
  }

  ngOnChanges(): void {
    this._store.dispatch(
      this._timepickerActions.updateControls(getControlsValue(this))
    );
  }

  changeTimeOption(option: string, step: number, source: TimeChangeSource = ''): void {
    const action: { [key: string]: string } = {
      hours: 'changeHours',
      minutes: 'changeMinutes',
      seconds: 'changeSeconds'
    };

    this._store.dispatch(
      (this as any)._timepickerActions[action[option]]({ step, source })
    );
  }

  // old api methods
  changeHours(step: number, source: TimeChangeSource = ''): void {
    this.changeTimeOption('hours', step, source);
  }

  changeMinutes(step: number, source: TimeChangeSource = ''): void {
    this.changeTimeOption('minutes', step, source);
  }

  changeSeconds(step: number, source: TimeChangeSource = ''): void {
    this.changeTimeOption('seconds', step, source);
  }


  updateTimeOption(option: string, value: string): void {
    (this as any)[option] = value;

    this._updateTime();
  }

  // old api methods
  updateHours(hours: string): void {
    this.updateTimeOption('hours', hours);
  }

  updateMinutes(minutes: string): void {
    this.updateTimeOption('minutes', minutes);
  }

  updateSeconds(seconds: string): void {
    this.updateTimeOption('seconds', seconds);
  }

  _updateTime() {
    this._store.dispatch(
      this._timepickerActions.setTime({
        hour: this.hours,
        minute: this.minutes,
        seconds: this.seconds,
        isPM: this.isPM()
      })
    );
  }

  onTimeChanged(hours: string, minutes: string, seconds?: string) {
    this.errors = this.validateAndReturnErrors({ hours, minutes, seconds });

    if (!this.errors) {
      [this.hours, this.minutes, this.seconds] = [hours, minutes, seconds];

      this._updateTime();

      return;
    }

    this.onChange(null);
    this.isValid.emit(false);
    this.meridian = this.meridians[0];
  }

  validateAndReturnErrors(timeValue: {[key: string]: string}): ValidationErrors | null {
    return compose([
      hoursValidator,
      minutesValidator,
      secondsValidator,
      getlimitsValidator(this.min, this.max, this.isPM())
    ])(timeValue);
  }

  toggleMeridian(): void {
    if (!this.showMeridian || !this.isEditable) {
      return;
    }

    const _hoursPerDayHalf = 12;

    this._store.dispatch(
      this._timepickerActions.changeHours({
        step: _hoursPerDayHalf,
        source: ''
      })
    );
  }

  /**
   * Write a new value to the element.
   */
  writeValue(obj: any): void {
    if (isValidDate(obj)) {
      this._store.dispatch(this._timepickerActions.writeValue(parseTime(obj)));
    } else if (obj == null) {
      this._store.dispatch(this._timepickerActions.writeValue(null));
    }
  }

  /**
   * Set the function to be called when the control receives a change event.
   */
  registerOnChange(fn: (_: any) => {}): void {
    this.onChange = fn;
  }

  /**
   * Set the function to be called when the control receives a touch event.
   */
  registerOnTouched(fn: () => {}): void {
    this.onTouched = fn;
  }

  /**
   * This function is called when the control status changes to or from "disabled".
   * Depending on the value, it will enable or disable the appropriate DOM element.
   *
   * @param isDisabled
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  ngOnDestroy(): void {
    this.timepickerSub.unsubscribe();
  }

  private _renderTime(value: string | Date): void {
    const _value = parseTime(value);
    const _hoursPerDayHalf = 12;

    let _hours = _value.getHours();

    if (this.showMeridian) {
      this.meridian = this.meridians[_hours >= _hoursPerDayHalf ? 1 : 0];
      _hours = _hours % _hoursPerDayHalf;
      // should be 12 PM, not 00 PM
      if (_hours === 0) {
        _hours = _hoursPerDayHalf;
      }
    }

    this.hours = padNumber(_hours);
    // rewrite value only if do not passed
    if (this.hoursRef && this.hoursRef.nativeElement.value !== this.hours) {
      this._renderer.setProperty(this.hoursRef.nativeElement, 'value', this.hours);
    }

    this.minutes = padNumber(_value.getMinutes());
    if (this.minutesRef && this.minutesRef.nativeElement.value !== this.minutes) {
      this._renderer.setProperty(this.minutesRef.nativeElement, 'value', this.minutes);
    }

    this.seconds = padNumber(_value.getUTCSeconds());
    if (this.secondsRef && this.secondsRef.nativeElement.value !== this.hours) {
      this._renderer.setProperty(this.secondsRef.nativeElement, 'value', this.seconds);
    }
  }
}
