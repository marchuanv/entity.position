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

    messagebus.subscribe({ host, port, path: "/remote/move", contentType }).callback = (entity) => {
        utils.log("ENTITY POSITION",`remote entity ${entity.name} has moved`, entity.position);
        return `${publicHost}:${publicPort} received response`;
    }

    messagebus.subscribe({ host, port, path: "/local/move", contentType }).callback = async (entity) => {
        utils.log("ENTITY POSITION",`local entity ${entity.name} has moved`, entity.position);
        await messagebus.publish({ username, passphrase, host: broadcastHost, port: broadcastPort, path: registerPath, contentType, content: { host: publicHost,  port: publicPort, path: "/remote/move" }});
        await messagebus.publish({ username, passphrase, host: broadcastHost, port: broadcastPort, path: broadcastPath, contentType, content: { path: "/remote/move", contentType, content: entity }});
        return `${publicHost}:${publicPort} received response`;
    }

    messagebus.subscribe({ host, port, path: "/", contentType: "text/html" }).callback = async () => {
        return `<html>\r\n <head>\r\n <title>Entity Position Test<\/title>\r\n <script src=\"https:\/\/cdnjs.cloudflare.com\/ajax\/libs\/jsencrypt\/2.3.1\/jsencrypt.js\"> <\/script>\r\n <\/head>\r\n <body>\r\n        <script>\r\n            const entity = {\r\n                name: \"admin\",\r\n                position: { x:0, y:0, z:0 }\r\n            };\r\n            const encrypt = new window.JSEncrypt();\r\n            document.addEventListener(\'keypress\', async function(event) {\r\n                if (event.key === \"w\" || event.key === \"a\" || event.key === \"s\" || event.key === \"d\"){\r\n                    const securityRes = await fetch(\"\/local\/move\", { method: \"GET\", headers: { \'content-type\': \'text\/plain\', \'username\': \'admin\', \'passphrase\': \'secure1\'} });\r\n  const token = securityRes.headers.get(\"token\");\r\n encrypt.setPublicKey(atob(securityRes.headers.get(\"publickey\")));\r\n const encryptedBody = encrypt.encrypt(JSON.stringify(entity));\r\n const res = await fetch(\"\/local\/move\", { method: \"POST\", headers: { \'content-type\': \'application\/json\', token}, body: encryptedBody });\r\n console.log(\"response: \",res.json());\r\n  }\r\n  });\r\n <\/script>\r\n  <\/body>\r\n<\/html>`
    }

})().catch((err)=>{
    console.log(err);
});
