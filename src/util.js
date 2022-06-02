import nconf from "nconf";
import moment from "moment";
import CLI from "clui";
import { readFile, writeFile } from "fs/promises";

nconf.file({ file: './config.json' });

export const MMDDYYYY = moment().format("MMDDYYYY");

export const CREATE_NEW_SPREADSHEET = nconf.get("createNewSpreadSheet"),
    SEND_EMAIL = nconf.get('sendEmail'),
    YOUR_NAME = nconf.get('yourName'),
    YOUR_EMAIL = nconf.get('yourEmail'),
    RECIPIENTS = nconf.get('recipients')

export const timeToFraction = (time) => {
        const _time =  moment(time, "hh:mm A");
        const hours = _time.hours();
        return ((hours+(_time.minutes()/60))/24).toFixed(3);
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
        .then(session => JSON.parse(session))
        .catch(err => console.log(`Unable to load file ${filename} `, err.message));

