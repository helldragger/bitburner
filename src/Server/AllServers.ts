import { serverMetadata } from "./data/servers";
import { Server } from "./Server";
import { SpecialServerIps } from "./SpecialServerIps";

import { HacknetServer } from "../Hacknet/HacknetServer";

import { getRandomInt } from "../../utils/helpers/getRandomInt";
import { createRandomIp } from "../../utils/IPAddress";
import { Reviver } from "../../utils/JSONReviver";
import { IMap } from "../types";

/**
 * Map of all Servers that exist in the game
 *  Key (string) = IP
 *  Value = Server object
 */
export let AllServers: IMap<Server | HacknetServer> = {};
export let hostname2Ip: IMap<string> = {};

export function ipExists(ip: string) {
	return (AllServers[ip] != null);
}

export function hostnameExists(hostname: string) {
    return (hostname2Ip[hostname] != null);
}

export function createUniqueRandomIp(): string {
    const ip = createRandomIp();

    // If the Ip already exists, recurse to create a new one
    if (ipExists(ip)) {
        return createRandomIp();
    }

	   return ip;
}

// Saftely add a Server to the AllServers map
export function AddToAllServers(server: Server | HacknetServer): void {
    const serverIp = server.ip;
    if (ipExists(serverIp)) {
        console.warn(`IP of server that's being added: ${serverIp}`);
        console.warn(`Hostname of the server thats being added: ${server.hostname}`);
        console.warn(`The server that already has this IP is: ${AllServers[serverIp].hostname}`);
        throw new Error("Error: Trying to add a server with an existing IP");
    }

    AllServers[serverIp] = server;
    if (server.hasOwnProperty("hostname")) { hostname2Ip[server.hostname] = serverIp; }
}

interface IServerParams {
    hackDifficulty?: number;
    hostname: string;
    ip: string;
    maxRam?: number;
    moneyAvailable?: number;
    numOpenPortsRequired: number;
    organizationName: string;
    requiredHackingSkill?: number;
    serverGrowth?: number;

    [key: string]: any;
}

export function initForeignServers(homeComputer: Server) {
    /* Create a randomized network for all the foreign servers */
    // Groupings for creating a randomized network
    const networkLayers: Server[][] = [];
    for (let i = 0; i < 15; i++) {
        networkLayers.push([]);
    }

    // Essentially any property that is of type 'number | IMinMaxRange'
    const propertiesToPatternMatch: string[] = [
        "hackDifficulty",
        "moneyAvailable",
        "requiredHackingSkill",
        "serverGrowth",
    ];

    const toNumber = (value: any) => {
        switch (typeof value) {
            case "number":
                return value;
            case "object":
                return getRandomInt(value.min, value.max);
            default:
                throw Error(`Do not know how to convert the type '${typeof value}' to a number`);
        }
    };

    for (const metadata of serverMetadata) {
        const serverParams: IServerParams = {
            hostname: metadata.hostname,
            ip: createUniqueRandomIp(),
            numOpenPortsRequired: metadata.numOpenPortsRequired,
            organizationName: metadata.organizationName,
        };

        if (metadata.maxRamExponent !== undefined) {
            serverParams.maxRam = Math.pow(2, toNumber(metadata.maxRamExponent));
        }

        for (const prop of propertiesToPatternMatch) {
            if (metadata[prop] !== undefined) {
                serverParams[prop] = toNumber(metadata[prop]);
            }
        }

        const server = new Server(serverParams);
        for (const filename of (metadata.literature || [])) {
            server.messages.push(filename);
        }

        if (metadata.specialName !== undefined) {
            SpecialServerIps.addIp(metadata.specialName, server.ip);
        }

        AddToAllServers(server);
        if (metadata.networkLayer !== undefined) {
            networkLayers[toNumber(metadata.networkLayer) - 1].push(server);
        }
    }

    /* Create a randomized network for all the foreign servers */
    const linkComputers = (server1: Server, server2: Server) => {
        server1.serversOnNetwork.push(server2.ip);
        server2.serversOnNetwork.push(server1.ip);
    };

    const getRandomArrayItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

    const linkNetworkLayers = (network1: Server[], selectServer: () => Server) => {
        for (const server of network1) {
            linkComputers(server, selectServer());
        }
    };

    // Connect the first tier of servers to the player's home computer
    linkNetworkLayers(networkLayers[0], () => homeComputer);
    for (let i = 1; i < networkLayers.length; i++) {
        linkNetworkLayers(networkLayers[i], () => getRandomArrayItem(networkLayers[i - 1]));
    }

    SERVERS_INITIALIZED = true;
}

export function prestigeAllServers() {
    for (const member in AllServers) {
        delete AllServers[member];
    }
    AllServers = {};
    hostname2Ip = {};
}

export let SERVERS_INITIALIZED = false;

export function loadAllServers(saveString: string) {
    AllServers = JSON.parse(saveString, Reviver);
    for (const ip in AllServers) {
        const server = AllServers[ip];
        if (server.hasOwnProperty("hostname")) {
            hostname2Ip[server.hostname] = server.ip;
        }
    }
    SERVERS_INITIALIZED = true;
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getServer(serverReference: string) { // can be an ip or a hostname.
    if (!SERVERS_INITIALIZED) { throw new Error("Servers not initialized yet!"); }
    if (hostname2Ip[serverReference]) {
        console.log(`${serverReference} reference to ip ${hostname2Ip[serverReference]} detected`);
        return AllServers[hostname2Ip[serverReference]]; // if its a reference
    }
    return AllServers[serverReference];    // else its an IP.
}
