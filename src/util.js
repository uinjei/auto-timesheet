import nconf from "nconf";
import moment from "moment";
import CLI from "clui";
import { readFile, writeFile } from "fs/promises";

nconf.file({ file: './config.json' });

export const MMDDYYYY = moment().format("MMDDYYYY");

export const CREATE_NEW_SPREADSHEET = nconf.get("createNewSpreadSheet"),
    SEND_EMAIL = nconf.get('sendEmail'),
    SET_REMINDER = nconf.get('setReminder'),
    REALTIME = nconf.get('realtime'),
    YOUR_NAME = nconf.get('yourName'),
    YOUR_EMAIL = nconf.get('yourEmail'),
    RECIPIENTS = nconf.get('recipients');

export const timeToFraction = (time) => {
    const _time =  moment(time, "h:mm A");
    const hours = _time.hours();
    return ((hours+(_time.minutes()/60))/24).toFixed(3);
}

export const adjust = async (isEndShift) => {
    const shiftStart = await getShiftStart();
    const today = moment(`${moment().format('MM/DD/YYYY')} ${shiftStart}`, "MM/DD/YYYY h:mm A");
    let adjusted;
    if (isEndShift) {
        if (today.isoWeekday()===5) adjusted = today.add(3, 'days');
        else adjusted = today.add(1, 'day');
    } else {
        adjusted = today.add('9', 'hours');
    }
    console.log('today ', today);
    console.log('adjusted.format("YYYY-MM-DDTHH:mm:ss") ', adjusted.format("YYYY-MM-DDTHH:mm:ss"));
    return adjusted.format("YYYY-MM-DDTHH:mm:ss");
}

export const Spinner = CLI.Spinner;

export const ANIMATION =["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];

export const updateSession = async (key, value) => {
    const session = await readJSONFile("session.json");
    session[key] = value;
    await writeFile("session.json", JSON.stringify(session));
}

export const readJSONFile = async (filename) => 
    await readFile(filename, { encoding: "utf8" })
        .then(file => JSON.parse(file))
        .catch(err => console.log(`Unable to load file ${filename} `, err.message));

const updateTasks = async (key, value) => {
    const tasks = await readJSONFile("tasks.json");
    tasks[key] = value;
    await writeFile("tasks.json", JSON.stringify(tasks, null, 2));
}

export const updateshiftStart = (value) => updateTasks("shiftStart", value);
export const updateshiftEnd = (value) => updateTasks("shiftEnd", value);

export const getShiftStart = async () => (await readJSONFile("tasks.json")).shiftStart;
export const getShiftEnd = async () => (await readJSONFile("tasks.json")).shiftEnd;