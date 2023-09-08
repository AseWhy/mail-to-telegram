import { BaseHandler } from "./providers/BaseHandler";
import { groupBy } from "lodash";
import { timeout } from "./utils";
import { Handlers, Pools } from "./providers";

import Conifg from "config";

const HandlersMap = new Map<string, BaseHandler<any>>(Handlers.map(e => [ e.type, e ]));

function pull() {
    return Promise.all(Pools.filter(e => e.ready).map(e => e.pull())).then(e => e.flat(2));
}

async function process() {
    const pulled = groupBy(await pull(), e => e.type);

    for(const key in pulled) {
        const handler = HandlersMap.get(key);

        if(handler == null) {
            continue;
        }

        await handler.handle(pulled[key]);
    }
}

void function run() {
    process()
        .then(timeout(Conifg.get("imap.pull.interval")))
        .catch(console.error)
    .finally(run);
}();