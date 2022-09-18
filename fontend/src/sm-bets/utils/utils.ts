import moment from "moment";
import { TimeSuffix } from "../constants";


export interface AlertState {
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error' | undefined;
    hideDuration?: number | null;
  }

  export const calculateSecondsLeft = (startDate: any, endDate:any) => {
    if (!moment.isMoment(startDate)) startDate = moment(startDate);
    if (!moment.isMoment(endDate)) endDate = moment(endDate);

    return endDate.diff(startDate, "second");
  }

  export const calculateMinutesLeft =  (startDate: any, endDate:any) => {
    if (!moment.isMoment(startDate)) startDate = moment(startDate);
    if (!moment.isMoment(endDate)) endDate = moment(endDate);

    return endDate.diff(startDate, "minutes");
  }

  export const calculateHoursLeft = (startDate: any, endDate:any) => {
    if (!moment.isMoment(startDate)) startDate = moment(startDate);
    if (!moment.isMoment(endDate)) endDate = moment(endDate);

    return endDate.diff(startDate, "hours");
  }


  export const getTime = (time: string) => {
      let seconds;
      let minutes;
      let hours;
      let returnTime;

      seconds = calculateSecondsLeft(time, Date())
      if (seconds === 1) {
        returnTime = seconds + TimeSuffix.second
      } else {
        returnTime = seconds + TimeSuffix.seconds
      }

      if (seconds >= "60") {
          minutes = calculateMinutesLeft(time, Date())
          if (minutes === 1) {
            returnTime = minutes + TimeSuffix.minute
          } else {
            returnTime = minutes + TimeSuffix.minutes
          }
         
      }

      if (minutes >= "60") {
          hours = calculateHoursLeft(time, Date())
          if (hours === 1) {
            returnTime = hours + TimeSuffix.hour
          } else {
          returnTime = hours + TimeSuffix.hours
          }
      }

      return returnTime
  }