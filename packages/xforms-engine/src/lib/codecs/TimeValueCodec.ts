import { Temporal } from 'temporal-polyfill';
import { type CodecDecoder, type CodecEncoder, ValueCodec } from './ValueCodec.ts';

export type TimeRuntimeValue = string | null;

export type TimeInputValue =
  | Date
  | Temporal.PlainDateTime
  | Temporal.PlainTime
  | Temporal.ZonedDateTime
  | string
  | null;

const validateTimeString = (value: string): TimeRuntimeValue => {
  if (value.endsWith('Z')) {
    value = value.slice(0, -1);
  }
  try {
    // Delegate bounds checking to Temporal
    return Temporal.PlainTime.from(value).toString();
  } catch {
    return null;
  }
};

const parseZonedDateTimeToString = (value: Temporal.ZonedDateTime): string => {
  if (!value) {
    return '';
  }

  return value.toPlainTime().toString({ fractionalSecondDigits: 0 });
};

/**
 * Converts a time-like value ({@link TimeInputValue}) to a strict time string.
 * Honors timezones/offsets if present on the input objects.
 *
 * @param value - The value to convert.
 * @returns A time string or empty string if invalid.
 */
const toTimeString = (value: TimeInputValue): string => {
  if (value == null) {
    return '';
  }

  try {
    if (value instanceof Date) {
      const zonedTime = Temporal.Instant.fromEpochMilliseconds(value.getTime()).toZonedDateTimeISO(
        Temporal.Now.timeZoneId()
      );
      return parseZonedDateTimeToString(zonedTime);
    }

    if (value instanceof Temporal.PlainTime) {
      return value.toString();
    }

    if (value instanceof Temporal.PlainDateTime) {
      return value.toPlainTime().toString();
    }

    if (value instanceof Temporal.ZonedDateTime) {
      return parseZonedDateTimeToString(value);
    }
    return validateTimeString(value) ?? '';
  } catch {
    return '';
  }
};

export class TimeValueCodec extends ValueCodec<'time', TimeRuntimeValue, TimeInputValue> {
  constructor() {
    const encodeValue: CodecEncoder<TimeInputValue> = (value) => {
      return toTimeString(value);
    };

    const decodeValue: CodecDecoder<TimeRuntimeValue> = (value: string) => {
      return validateTimeString(value);
    };

    super('time', encodeValue, decodeValue);
  }
}
