import Imap from "node-imap";
import Config from "config";

export const imap = new Imap({
    user: Config.get("imap.user"),
    password: Config.get("imap.password"),
    host: Config.get("imap.host"),
    port: Config.get("imap.port"),
    tls: Config.get("imap.tls")
});