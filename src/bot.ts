import { text } from 'stream/consumers';
import { preferences } from "./utils/preferences";
import { simpleParser } from 'mailparser';
import { Box } from 'node-imap';
import { sendMessageOfMail } from './telegram';
import { imap } from './imap';

function openInbox(cb: (err: Error | null, box: Box) => void) {
    imap.openBox('INBOX', true, cb);
}

function checkNewMessages() {
    openInbox(async (err: Error | null, box: Box) => {
        if (err) {
            throw err;
        }

        if(box.messages.total == preferences.lastReaded) {
            return;
        }

        const f = imap.seq.fetch(box.messages.total + ':*', { bodies: [ '' ] });

        f.on('message', function(msg, seqno) {
            msg.on('body', function(stream, info) {
                text(stream).then(simpleParser).then(data => sendMessageOfMail('(#' + seqno + ')', data));
            });
        });

        f.once('error', function(err) {
            console.log('Fetch error: ' + err);
        });

        f.once('end', function() {
            
        });

        preferences.lastReaded = box.messages.total;
        preferences.save();

        console.log("Update offset " + preferences.lastReaded)
    });
}

imap.once('ready', function() {
    console.log("Start listen, initial offset " + preferences.lastReaded);
    checkNewMessages();
    setInterval(checkNewMessages, 5000);
});

imap.once('error', function(err) {
    console.log(err);
});

imap.once('end', function() {
    console.log('Connection ended');
});

imap.connect();