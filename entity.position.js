const messagebus = require("messagebus");
const utils = require("utils");

const host = process.env.HOST || "localhost";
const port = process.env.PORT || 4000;

const publicHost = process.env.PUB_HOST || host;
const publicPort = process.env.PUB_PORT || port;

const broadcastHost = process.env.BROADCAST_HOST || "localhost";
const broadcastPort = process.env.BROADCAST_PORT || 5000;

const path = "/entity/position";
const broadcastPath = "/broadcast";
const registerPath = "/register";
const contentType = "application/json";
const username = process.env.PLAYERNAME || "anonymous";
const passphrase = process.env.PASSPHRASE || "secure1";

(async () => {
    
    await messagebus.publish({ username, passphrase, host: broadcastHost, port: broadcastPort, path: registerPath, contentType, content: { host: publicHost,  port: publicPort, path }});

    messagebus.subscribe({ host, port, path: broadcastPath, contentType }).callback = (entity) => {
        utils.log("ENTITY POSITION",`remote entity: ${entity.name} has moved`, entity.position);
        return `${publicHost}:${publicPort} received response`;
    }

    messagebus.subscribe({ host, port, path: "/move", contentType }).callback = async (entity) => {
        utils.log("ENTITY POSITION",`local entity: ${entity.name} has moved`, entity.position);
        await messagebus.publish({ username, passphrase, host: broadcastHost, port: broadcastPort, path: broadcastPath, contentType, content: { path, contentType, content: entity }});
        return `${publicHost}:${publicPort} received response`;
    }

})();
