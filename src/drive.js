import { google } from "googleapis";
import async from "async";

import { RECIPIENTS, Spinner, ANIMATION } from "./util";
import { updateCells } from "./sheets";

const drive = google.drive("v3");

export default (auth, spreadsheetId, callback) => {
    
    const proms = RECIPIENTS.split(",").map(emailAddress => {
        return new Promise((resolve, reject) => {
            const status = new Spinner(`Creating persmission for ${emailAddress}...`, ANIMATION);
            status.start();

            const permissions = [
                {
                type: 'user',
                role: 'reader',
                emailAddress
                }
            ];
        
            async.eachSeries(permissions, function (permission, callback) {
                drive.permissions.create({
                auth,
                resource: permission,
                fileId: spreadsheetId,
                fields: 'id',
                sendNotificationEmail: false,
                }, function (err, response) {
                    if (err) {
                        status.stop();
                        console.error(`  ✗ Failed to create permission for ${emailAddress}: `, err);
                        callback(err);
                    } else {
                        status.stop();
                        console.log(`  ✔ Creating read permission for ${emailAddress}: `, response.statusText)
                        callback();
                    }
                });
            }, function (err) {
                    if (err) {
                        console.error(err);
                        reject();
                    } else {
                        resolve();
                    }
            });
        });
    });

    Promise.all(proms).then(() => callback(auth, updateCells));
}