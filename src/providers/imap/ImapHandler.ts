import { ParsedMail } from "mailparser";
import { BaseHandler } from "../BaseHandler";
import { ImapProviderData } from "./ImapProviderData";
import { sendMessageOfMail } from "../../telegram";
import { IMAP_DATA_TYPE } from "./ImapPool";

export class ImapHandler extends BaseHandler<ParsedMail> {
    public get type(): string {
        return IMAP_DATA_TYPE;
    }

    public async handle(data: ImapProviderData[]) {
        for(const current of data) {
            await sendMessageOfMail(current.data);
        }
    }
}