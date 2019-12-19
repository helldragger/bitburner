import { GangMember } from "../../Gang";
import { BaseServer } from "../../Server/BaseServer";
import { ManualEntry, registerExecutable } from "../../Server/lib/sys";
import { Page, routing } from "../../ui/navigationTracking";
import { canRecruitMember } from "./canRecruitMember";
import { throwIfNoGang } from "./throwIfNoGang";

export function recruitMember(server: BaseServer, term: any, out: Function, err: Function, args: string[], options: any = {}) {
    throwIfNoGang(server, term, err);
    let gang = term.getPlayer().gang;
    //throws an error if the player cannot recruit
    let canRecruit: boolean = false;
    canRecruitMember(server, term, (tmp: boolean) => {
        canRecruit = tmp;
    }, err, []);
    if (!canRecruit) {
        err(`You cannot recruit a member currently`);
        return false;
    }
    if (args.length !== 1) {
        err(`You must provide a name and only one`);
        return false;
    }
    const name: string = args.shift() as string;
    if (name === "") {
        err(`You must provide a non-empty name`);
        return false;
    }
    if (Object.keys(gang.members).includes(name)) {
        err(`Another member is already named ${name}, you must provide a unique name`);
        return false;
    }
    const member = new GangMember(name);
    out(`${name} has been recruited`);
    gang.members[name] = member;
    if (routing.isOn(Page.Gang)) {
        gang.createGangMemberDisplayElement(member);
        gang.updateGangContent();
    }
    return true;
}

const MANUAL = new ManualEntry(
    `recruitMember - Recruits a new gang member.`,
    `recruitMember MEMBERNAME`,
    `Recruits a new gang member. The member name must be unique.`);

registerExecutable("recruitMember", recruitMember, MANUAL, true, "gang");