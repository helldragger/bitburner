import { BaseServer } from "../BaseServer";

import {
    listAllDarkwebItems,
    buyDarkwebItem
} from "../../DarkWeb/DarkWeb";
import { DarkWebItems }                         from "../../DarkWeb/DarkWebItems";

import { SpecialServerIps } from "../SpecialServerIps";
import { Player }                               from "../../Player";

export function buy(server: BaseServer, term: any, out:Function, err:Function, args: string[], options:any={}){
    const HELP = "Usage: buy <-l --list> ITEMNAME";
    // TODO : why not passing the wanted vendor ip/hostname to determine which of multiple marketplace to buy from?

    if(!options.SpecialServerIps){// not testing mode
        options.SpecialServerIps= SpecialServerIps;
    }
    if (!options.SpecialServerIps.hasOwnProperty("Darkweb Server"))
    {
        err("You need to be able to connect to the Dark Web to use the buy command. (Maybe there's a TOR router you can buy somewhere)");
        return;
    }
    if (!options.list) options.list = false;
    if (!options.itemName) options.itemName = undefined;
    while(args.length > 0){
        let arg = args.shift() as string;
        switch(arg){
            case "-l":
            case "--list":
                options.list = true;
                break;
            default:
                if (!options.itemName) options.itemName = arg;
                else {
                    err(HELP);
                    return;
                }
                break;
        }
    }
    if (options.list){
        for(const key in DarkWebItems) {
            const item = DarkWebItems[key];
            out(item.toString());
        }
        return;
    }
    if(!options.itemName){
        err(HELP);
        return;
    }

    options.itemName = options.itemName.toLowerCase();

    // find the program that matches, if any
    let item = null;
    for(const key in DarkWebItems) {
        const i = DarkWebItems[key];
        if(i.program.toLowerCase() == options.itemName) {
            item = i;
        }
    }

    // return if invalid
    if(item === null) {
        err("Unrecognized item: "+options.itemName);
        return;
    }
    if(!options.Player){ // not testing mode
        options.Player = Player
    }
    // return if the player already has it.
    if(options.Player.hasProgram(item.program)) {
        err('You already have the '+item.program+' program');
        return;
    }

    // return if the player doesn't have enough money
    if(options.Player.money.lt(item.price)) {
        err("Not enough money to purchase " + item.program);
        return;
    }

    // buy and push
    options.Player.loseMoney(item.price); //TODO perhaps change the saving location to another special fs?
    options.Player.getHomeComputer().programs.push(item.program); // TODO determine the content of programs.
    out('You have purchased the ' + item.program + ' program. The new program can be found on your home computer.');
}


import {registerExecutable, ManualEntry} from "./sys";

const MANUAL = new ManualEntry(
`buy - Purchase a program through the Dark Web.`,
`buy -l
buy PROGRAM`,
`Purchase a program through the Dark Web and download the purchased
executable at the root of your home computer. Requires a TOR router.

If this command is ran with the '-l' flag, it will display a list of
all programs that can be bought through the dark web to the Terminal,
as well as their costs.

Otherwise, the name of the program must be passed in as a parameter.
This is name is NOT case-sensitive.


--help
    display this help and exit

-l
    lists all available programs on the Dark Web market.
`)
registerExecutable("buy", buy, MANUAL);
