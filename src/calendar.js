import { google } from "googleapis";

import { Spinner, ANIMATION, adjust, getShiftEnd, getShiftStart } from "./util";

export default async (auth, isEndShift) => {
  const status = new Spinner("Creating reminder...", ANIMATION);
  status.start();

  const dateTime = await adjust(isEndShift);

  const startOrEnd = isEndShift?"start":"end";
  const requestBody = {
    summary: `Don't forget to ${startOrEnd} your shift today!`,
    start: {
      dateTime,
      timeZone: "Asia/Manila"
    },
    end: {
      dateTime,
      timeZone: "Asia/Manila"
    }
  };

  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.insert({
      calendarId: "primary",
      requestBody
  },(err, res) => {
    status.stop();
    if (err) return console.log(" ✗ Failed to create reminder: " + err);
    console.log("  ✔ Creating reminder: ", res.statusText);
  });
}