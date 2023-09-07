import { ParsedMail } from "mailparser";
import { chunkSubstr } from "../utils";
import { NodeHtmlMarkdown } from "node-html-markdown";

import TelegramBot from "node-telegram-bot-api";
import Config from "config";

const bot = new TelegramBot(Config.get("telegram.token"), { polling: false });

export function sendMessageOfMail(prefix: string, box: ParsedMail) {
    let receivers: number[] = Config.get("telegram.chatIds");
    let body = '';

    if(box.from) {
        body += `От: ${box.from.text}\n`;
    }

    if(box.text) {
        body += `Дата: ${new Date().toISOString()}\n`;
        body += `===========================\n\n${NodeHtmlMarkdown.translate(box.text.replace(/\n|\r|\n\r/g, "<br>"))}`;
    }

    if(body.length == 0) {
        return;
    }

    for(const current of receivers) {
        for(const chunk of chunkSubstr(`${prefix}\n${body}`, 4095)) {
            bot.sendMessage(current, chunk);
        }
    }
}