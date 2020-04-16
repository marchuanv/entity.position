const messagebus = require("messagebus");
const utils = require("utils");

const host = process.env.HOST || "localhost";
const port = process.env.PORT || 4000;

const destHost = "relayor.herokuapp.com";
const destPort = 80;
const path = "/entity/position";
const broadcastPath = "/broadcast";
const registerPath = "/register";
const contentType = "application/json";
const username = process.env.PLAYERNAME || "anonymous";
const passphrase = process.env.PASSPHRASE || "secure1";

messagebus.subscribe({ host, port: port, path, contentType }).callback = (entity) => {
    const message = `${host}:${port} received response`;
    utils.log("Entity Position",`${message}: `, entity);
    return message;
}

(async () => {
    const entity = {name: username, position: { x:0, y:0, z:0 }};
    await messagebus.publish({ username, passphrase, host: destHost, port: destPort, path: registerPath, contentType, content: { host,  port, path }});
    await messagebus.publish({ username, passphrase, host: destHost, port: destPort, path: broadcastPath, contentType, content: { path, contentType, content: entity }});
})();
