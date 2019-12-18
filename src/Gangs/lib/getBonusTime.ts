import { BaseServer } from "../../Server/BaseServer";

export function getBonusTime(server: BaseServer, term: any, out:Function, err:Function, args: string[], options:any={type:false, list:false}) {

    try {
        let result = Math.round(term.getPlayer().gang.storedCycles / 5);
        out(result);
        return true;
    } catch(e) {
        err( e );
        return false;
    }
}

import { registerExecutable, ManualEntry } from "../../Server/lib/sys";

const MANUAL = new ManualEntry(
`getBonusTime - Displays the amount of bonus time remaining for your gang.`,
`getBonusTime`,
`Displays the amount of bonus time remaining for your gang.`);

registerExecutable("getBonusTime", getBonusTime, MANUAL, true, "gang");