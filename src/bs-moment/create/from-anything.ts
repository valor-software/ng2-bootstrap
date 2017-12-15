// tslint:disable:max-line-length
import { isArray, isNumber, isObject, isObjectEmpty, isString, isUndefined } from '../utils/type-checks';
import { DateParsingConfig } from './parsing.types';
import { getLocale } from '../locale/locales.service';
import { setOffsetToUTC } from '../units/offset';
import { add } from '../moment/add-subtract';
import { createInvalid, isValid } from './valid';
import { isDate } from 'rxjs/util/isDate';
import { configFromStringAndArray } from './from-string-and-array';
import { configFromStringAndFormat } from './from-string-and-format';
import { cloneDate } from './clone';
import { configFromString } from './from-string';
import { configFromArray } from './from-array';
import { configFromObject } from './from-object';
import { checkOverflow } from './check-overflow';

function createFromConfig(config: DateParsingConfig): DateParsingConfig {
  const res = checkOverflow(prepareConfig(config));
  if (res._nextDay) {
    // Adding is smart enough around DST
    res._d = add(res._d, 1, 'day');
    res._nextDay = undefined;
  }

  return res;
}

export function prepareConfig(config: DateParsingConfig): DateParsingConfig {
  let input = config._i;
  const format = config._f;

  config._locale = config._locale || getLocale(config._l);

  if (input === null || (format === undefined && input === '')) {
    return createInvalid(config, { nullInput: true });
  }

  if (isString(input)) {
    config._i = input = config._locale.preparse(input);
  }

  if (isDate(input)) {
    config._d = cloneDate(input);

    return config;
  }

  // todo: add check for recursion

  if (isArray(format)) {
    configFromStringAndArray(config);
  } else if (format) {
    configFromStringAndFormat(config);
  } else {
    configFromInput(config);
  }

  if (!isValid(config)) {
    config._d = null;
  }

  return config;
}

function configFromInput(config: DateParsingConfig): DateParsingConfig {
  const input = config._i;
  if (isUndefined(input)) {
    config._d = new Date();
  } else if (isDate(input)) {
    config._d = cloneDate(input);
  } else if (isString(input)) {
    configFromString(config);
  } else if (isArray<string>(input) && input.length) {
    config._a = input.slice(0).map(obj => parseInt(obj, 10));
    configFromArray(config);
  } else if (isObject(input)) {
    configFromObject(config);
  } else if (isNumber(input)) {
    // from milliseconds
    config._d = new Date(input);
  } else {
    //   hooks.createFromInputFallback(config);
    return createInvalid(config);
  }

  return config;
}

export function createLocalOrUTC(input: string | number, format?: string, localeKey?: string, strict?: boolean, isUTC?: boolean): DateParsingConfig {
  const config: DateParsingConfig = {};
  let _input = input;

  // params switch -> skip; test it well
  // if (localeKey === true || localeKey === false) {
  //     strict = localeKey;
  //     localeKey = undefined;
  // }

  // todo: fail fast and return not valid date
  if ((isObject(_input) && isObjectEmpty(_input)) || (isArray(_input) && _input.length === 0)) {
    _input = undefined;
  }
  // object construction must be done this way.
  // https://github.com/moment/moment/issues/1423
  // config._isAMomentObject = true;
  config._useUTC = config._isUTC = isUTC;
  config._l = localeKey;
  config._i = _input;
  config._f = format;
  config._strict = strict;

  return createFromConfig(config);
}
