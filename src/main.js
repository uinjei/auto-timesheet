import http from "http";
import querystring from "querystring";
import { readFile, writeFile } from "fs/promises";
import { google } from "googleapis";
import open from "open";

import { CREATE_NEW_SPREADSHEET } from "./util";
import sendMail from "./gmail";
import { addSheet, createSpreadSheet, updateCells, endShift } from "./sheets";

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/gmail.compose',
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/calendar',
              ];
const TOKEN_PATH = 'token.json';

const authorize = (credentials, callback, args) => {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  readFile(TOKEN_PATH, { encoding: "utf8" }).then(token => {
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client, args);
  }).catch(err => {
      return getNewToken(oAuth2Client, callback, args);
  });
}

const getNewToken = async (oAuth2Client, callback, args) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  redirect(oAuth2Client, callback, args);
  await open(authUrl);
}

const doRequests = async (auth, args) => {
  const arg = args[2];
  /* add sheet */
  if (arg==="--end-shift") endShift(auth, sendMail);
  else  {
    if (CREATE_NEW_SPREADSHEET) createSpreadSheet(auth, addSheet);
    else addSheet(auth, updateCells);
  }

}

const redirect = (oAuth2Client, callback, args) => {
  const hostname = '127.0.0.1';
  const port = 3000;

  const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('You can now close the browser or tab');
    const query = querystring.parse(req.url);

    oAuth2Client.getToken(query['/?code'], (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token: ', err.message);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      writeFile(TOKEN_PATH, JSON.stringify(token)).then(ddd => {
            console.log('Token stored to', TOKEN_PATH);
          }
        ).catch(err => {
            return console.error(err);
        });
      callback(oAuth2Client, args);
    });

  });

  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}

function main() {
  const args = process.argv;
  readFile('credentials.json', { encoding: "utf8" }).then(content => {
    authorize(JSON.parse(content), doRequests, args);
  }).catch(err => {
    return console.log('Error loading client secret file:', err);
  });
}

if (require.main === module) {
  main();
}