import { ImapHandler } from "./imap/ImapHandler";
import { ImapPool } from "./imap/ImapPool";

export const Pools = [
    new ImapPool()
];

export const Handlers = [
    new ImapHandler()
];