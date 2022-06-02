import { google } from "googleapis";
import { readFile } from "fs/promises";

import { timeToFraction, Spinner, ANIMATION, YOUR_NAME, MMDDYYYY, readJSONFile, updateSession } from "./util";
import createPermission from "./drive";
import sendMail from "./gmail";
import template from "./template";

const sheets = google.sheets('v4');

export const addSheet = async (auth, callback) => {
    const status = new Spinner("Creating new sheet", ANIMATION);
    status.start();
    const spreadsheetId = (await readJSONFile("session.json")).spreadsheetId;
    sheets.spreadsheets.batchUpdate(
      {
          auth,
          spreadsheetId,
          resource: {
              requests: [
                  {
                    addSheet: {
                      properties: {
                        index: 0,
                        title: MMDDYYYY
                      }
                    }
                  }
              ],
          }
      }, (err, response) => {
          if (err) {
            status.stop();
            console.log('  ✗ Create sheet failed: ', err.message);
            process.exit();
          }
          status.stop();
          console.log("  ✔ Creating new sheet: ", response.statusText);
          callback(auth, response.data.replies[0].addSheet.properties.sheetId, sendMail);
      }
    );
}

export const updateCells = async (auth, sheetId, callback) => {
    const status = new Spinner("Populating sheet...", ANIMATION);
    status.start();
    
    const spreadsheetId = (await readJSONFile("session.json")).spreadsheetId;
    sheets.spreadsheets.batchUpdate(
      {
        auth,
        spreadsheetId,
        resource: {
          requests: await template(sheetId),
        }
      }, (err, response) => {
          if (err) {
            status.stop();
            console.log('  ✗ Populate sheet failed: ', err.message);
            process.exit();
          }
          status.stop();
          console.log("  ✔ Populating sheet: ", response.statusText);
          /* CB: sendMail */
          callback(auth, `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheetId}`, false);
    });
}

export const createSpreadSheet = (auth, callback) => {
    console.log("Create new spread sheet is set to true.");
    const status = new Spinner("Creating new spread sheet...", ANIMATION);
    status.start();
  
    sheets.spreadsheets.create({
      auth,
      resource: {
        properties: {
          title: `WFH Report_${YOUR_NAME}_${MMDDYYYY}`,
        },
      },
      fields: 'spreadsheetId',
    }, async (err, response) => {
      if (err) {
        status.stop();
        console.log('  ✗ Create spreadsheet failed: ', err.message);
        process.exit();
      }
      const spreadsheetId = response.data.spreadsheetId;
      await updateSession("spreadsheetId", spreadsheetId);
      status.stop();
      console.log("  ✔ Creating new spread sheet: ", response.statusText);
      createPermission(auth, spreadsheetId, callback);
    });
}

const populateAndUpdateRow = (tasks, column) => {
    return tasks.description.map(task => {
        let columnValue = task[column];
        const _valueType = (typeof columnValue) === "string"?"stringValue":"numberValue";

        return {
            values: {
                userEnteredValue:{
                    [_valueType]: columnValue
                }
            }
        }
    });
}

export const endShift = async (auth, callback) => {
    const status = new Spinner("Populating sheet...", ANIMATION);
    status.start();

    const spreadsheetId = (await readJSONFile("session.json")).spreadsheetId;
    const tasks = await readFile("tasks.json", { encoding: "utf8" })
        .then(tasks => JSON.parse(tasks))
        .catch(err => console.log("unable to load tasks.json: ", err.message));


    const request = {
        spreadsheetId,
        includeGridData: false,
        auth,
    };

    const sheetId = (await sheets.spreadsheets.get(request)).data.sheets[0].properties.sheetId;

    sheets.spreadsheets.batchUpdate(
        {
            auth,
            spreadsheetId,
            resource: {
                requests: [
                    {
                        updateCells: {
                            start: {
                                sheetId,
                                rowIndex: 1,
                                columnIndex: 3
                            },
                            rows: [
                                {
                                    values: {
                                        userEnteredValue: {
                                            numberValue: timeToFraction(tasks.shiftEnd)
                                        }
                                    }
                                }
                            ],
                            fields: 'userEnteredValue'
                        }
                    },
                    {
                        updateCells: {
                            start: {
                                sheetId,
                                rowIndex: 3,
                                columnIndex: 0
                            },
                            rows: populateAndUpdateRow(tasks, "project"),
                            fields: 'userEnteredValue'
                        }
                    },
                    {
                        updateCells: {
                            start: {
                                sheetId,
                                rowIndex: 3,
                                columnIndex: 1
                            },
                            rows: populateAndUpdateRow(tasks, "name"),
                            fields: 'userEnteredValue'
                        }
                    },
                    {
                        updateCells: {
                            start: {
                                sheetId,
                                rowIndex: 3,
                                columnIndex: 2
                            },
                            rows: populateAndUpdateRow(tasks, "estimatedTime"),
                            fields: 'userEnteredValue'
                        }
                    }, {
                        updateCells: {
                            start: {
                                sheetId,
                                rowIndex: 3,
                                columnIndex: 3
                            },
                            rows: populateAndUpdateRow(tasks, "actualTime"),
                            fields: 'userEnteredValue'
                        }
                    }
                ],
            }
        }, (err, response) => {
            if (err) {
                status.stop();
                console.log(' ✗ Populate sheet failed: ', err.message);
                process.exit();
            }
            status.stop();
            console.log(' ✔ Populating sheet: ', response.statusText);
            callback(auth, `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheetId}`, true);
    });
}