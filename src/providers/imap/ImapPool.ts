import { ImapProviderData } from "./ImapProviderData";
import { BasePool } from "../BasePool";
import { preferences } from "../../utils/preferences";
import { ParsedMail, simpleParser } from "mailparser";
import { text } from "stream/consumers";

import Config from "config";
import Connection from "node-imap";

export const IMAP_DATA_TYPE = 'imap';

export interface ImapConfig {
    user: string;
    password: string;
    host: string;
    port: number;
    tls: boolean;
}

export interface ConnectionWrapper {
    connection: Connection;
    config: ImapConfig;
    uid: string;
}

export class ImapPool extends BasePool<ParsedMail> {
    private readonly connections: ConnectionWrapper[];

    private connectable: number;
    private connected: number;

    constructor() {
        super();

        this.connections = [];
        
        const configurations: ImapConfig[] = [];
        const config = Config.get<ImapConfig | ImapConfig[]>("imap.confurations");

        if(Array.isArray(config)) {
            configurations.push(...config);
        } else {
            configurations.push(config);
        }

        for (const config of configurations) {
            const uid = `${config.host}:${config.port}@${config.user}`;
            const connection = new Connection(Object.assign({}, config, {
                "port": 143,
                "tls": false
            }));

            connection.once('ready', () => {
                this.connected++;

                console.log(`Start listen, initial offset of ${uid}: ${preferences[uid]?.lastReaded ?? 0}`);
            });
            
            connection.once('error', (err) => {
                console.error(`Error while connect ${uid}`, err);
            });
            
            connection.once('end', () => {
                this.connected--;
                this.connectable--;
                console.log(`Connection ended ${uid}`);
            });

            connection.connect();

            this.connections.push({ connection, config, uid });
        }

        this.connectable = configurations.length;
        this.connected = 0;
    }

    public get ready(): boolean {
        return this.connected >= this.connectable;
    }

    public pull(): Promise<ImapProviderData[]> {
        if(!this.ready) {
            throw new Error("Pool not ready yet!");
        }

        return new Promise((res, rej) => {
            let result: ImapProviderData[] = [];
            let awaiting = this.connections.length, awaited = 0;

            function check() {
                if(awaiting >= awaited) {
                    res(result);
                }
            }

            for(const { connection, uid } of this.connections) {
                connection.openBox('INBOX', true, (err, box) => {
                    if(err) {
                        return rej(err);
                    }

                    if(preferences[uid] == null) {
                        preferences[uid] = { lastReaded: box.messages.total };
                        preferences.save();
                    }

                    const lastReaded = preferences[uid].lastReaded;

                    if(box.messages.total <= lastReaded) {
                        return res([]);
                    }

                    console.log(`Pull messages ${uid} ${box.messages.total}:${lastReaded}`);

                    const f = connection.seq.fetch((lastReaded + 1) + ':*', { bodies: [ '' ] });
            
                    f.on('message', function(msg, seqno) {
                        msg.on('body', function(stream, info) {
                            text(stream).then(simpleParser).then(parsed => {
                                result.push(new ImapProviderData(parsed, IMAP_DATA_TYPE));
                                awaited++;
                                check();
                            });
                        });
                    });
            
                    f.once('error', function(err) {
                        console.error(`Fetch error ${uid}`, err);
                    });
            
                    preferences[uid].lastReaded = box.messages.total;
                    preferences.save();
            
                    console.log(`Update offset of ${uid} from ${lastReaded} to ${preferences[uid].lastReaded}`);
                });
            }
        });
    }
}