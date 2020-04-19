const messagebus = require("messagebus");
const utils = require("utils");

const host = process.env.HOST || "localhost";
const port = process.env.PORT || 4000;

const publicHost = process.env.PUB_HOST || "localhost";
const publicPort = process.env.PUB_PORT || 4000;

const destHost = process.env.DEST_HOST || "localhost";
const destPort = process.env.DEST_PORT || 5000;

const path = "/entity/position";
const broadcastPath = "/broadcast";
const registerPath = "/register";
const contentType = "application/json";
const username = process.env.PLAYERNAME || "anonymous";
const passphrase = process.env.PASSPHRASE || "secure1";

(async () => {
    
    await messagebus.publish({ username, passphrase, host: destHost, port: destPort, path: registerPath, contentType, content: { host: publicHost,  port: publicPort, path }});

    messagebus.subscribe({ host, port, path: broadcastPath, contentType }).callback = (entity) => {
        utils.log("Remote Entity Moved","", entity);
        return `${publicHost}:${publicPort} received response`;
    }

    messagebus.subscribe({ host, port, path: "/move", contentType }).callback = async (entity) => {
        utils.log("Local Entity Moved","", entity);
        await messagebus.publish({ username, passphrase, host: destHost, port: destPort, path: broadcastPath, contentType, content: { path, contentType, content: entity }});
        return `${publicHost}:${publicPort} received response`;
    }

})();
