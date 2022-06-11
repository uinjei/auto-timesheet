import { google } from "googleapis";
import MailComposer from "nodemailer/lib/mail-composer";
import { readFile } from "fs/promises";

import createReminder from "./calendar";
import { MMDDYYYY, SEND_EMAIL, SET_REMINDER, YOUR_NAME, YOUR_EMAIL, RECIPIENTS,
  Spinner, ANIMATION, readJSONFile, updateSession } from "./util";

const getGmailService = (auth) => {
  const gmail = google.gmail({ version: 'v1', auth });
  return gmail;
};

const encodeMessage = (message) => {
  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const createMail = async (options) => {
  const mailComposer = new MailComposer(options);
  const message = await mailComposer.compile().build();
  return encodeMessage(message);
};

const getMessageBody = async (link, isReply) => {
  let emailTemplate = await readFile(isReply?"email-template-end-shift.html":"email-template-start-shift.html", { encoding: "utf8" })
    .catch(err => console.log("unable to load email template: ", err.message));
  const emailVars = await readFile("email-vars.json", { encoding: "utf8" })
    .then(vars => JSON.parse(vars))
    .catch(err => console.log("unable to load email-vars.json: ", err.message));
  for (const prop in emailVars) {
    emailTemplate = emailTemplate.replace(`\$\{${prop}\}`, emailVars[prop]);
  }
  return emailTemplate.replace("${link}", link);
}

const sendEmail = async (auth, gmail, link, isReply) => {
  console.log("Auto send email is set to true.");
  const status =  new Spinner("Sending mail...", ANIMATION);
  status.start();

  let _id;
  const replyId = (await readJSONFile("session.json")).replyId;
  if (isReply) _id = { threadId: replyId};

  const rawMessage = await compose(link, isReply);
  const response = await gmail.users.messages.send({
    userId: 'me',
    resource: {
      ..._id,
      raw: rawMessage,
    },
  });
  
  if (!isReply) {
    await updateSession("replyId", response.data.id);
  }
  status.stop();
  console.log("  ✔ Sending mail: OK: ", response.statusText);
  if (SET_REMINDER) createReminder(auth, isReply);
}

const createDraft = async (auth, gmail, link, isReply) => {
  console.log("Auto send email is set to false.");
  const status = new Spinner("Creating draft message...", ANIMATION);
  status.start();

  let _id;
  const replyId = (await readJSONFile("session.json")).replyId;
  if (isReply) _id = {threadId: replyId};

  const rawMessage = await compose(link, isReply);
  const response = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: {
      ..._id,
      message: {
        raw: rawMessage
      }
    }
  });
  if (!isReply) {
    await updateSession("replyId", response.data.message.id);
  }
  status.stop();
  console.log("  ✔ Creating draft message: ", response.statusText);
  if (SET_REMINDER) createReminder(auth, isReply);
}

const compose = async (link, isReply) => {
  let reply;
  const replyId = (await readJSONFile("session.json")).replyId;
  if (isReply) reply = {
    inReplyTo: replyId,
    references: replyId
  };

  const options = {
    to: RECIPIENTS,
    replyTo: YOUR_EMAIL,
    ...reply,
    subject: `WFH Report_${YOUR_NAME}_${MMDDYYYY}`,
    text: 'This email is sent from the command line',
    html: await getMessageBody(link, isReply),
    textEncoding: 'base64',
    headers: [
      { key: 'X-Application-Developer', value: 'Edwin Jay Javier' },
      { key: 'X-Application-Version', value: 'v0.1.0' }
    ],
  };

  return await createMail(options);
}

export default (auth, link, isReply) => {
  const gmail = getGmailService(auth);
  if (SEND_EMAIL) return sendEmail(auth, gmail, link, isReply);
  else return createDraft(auth, gmail, link, isReply);
};