const messagebus = require("messagebus");
const fs = require("fs");

const sourcePrivatePort = Number(process.env.PORT || 4000);
const sourcePublicHost = process.env.PUB_HOST || "localhost";
const sourcePublicPort = Number(process.env.PUB_PORT || sourcePrivatePort);

const broadcastHost = process.env.BROADCAST_HOST || sourcePublicHost;
const broadcastPort = Number(process.env.BROADCAST_PORT || 5000);

const broadcastPath = "/broadcast";
const registerPath = "/register";
const contentType = "application/json";
const username = process.env.USERNAME || "anonymous";
const passphrase = process.env.PASSPHRASE || "secure1";

const logging = require("logging");
logging.config([
    "Entity Position",
    "MessageBus Publisher",
    "MessageBus Subscriber",
    "Component Client",
    "Component Server",
    "Component Secure Client",
    "Component Secure Server"
]);

(async () => {

    messagebus.subscribe({ sourcePublicHost, sourcePublicPort, sourcePrivatePort, path: "/remote/move", contentType }).callback = (entity) => {
        logging.write("Entity Position",`remote entity ${entity.name} has moved`, entity.position);
    }

    messagebus.subscribe({ sourcePublicHost, sourcePublicPort, sourcePrivatePort, path: "/local/move", contentType }).callback = async (entity) => {
        
        logging.write("Entity Position",`local entity ${entity.name} has moved`, entity.position);
        
        await messagebus.publish({ 
            username, 
            passphrase, 
            destPublicHost: broadcastHost, 
            destPublicPort: broadcastPort,
            sourcePublicHost, 
            sourcePublicPort,
            path: registerPath, 
            contentType, 
            content: { host: sourcePublicHost,  port: sourcePublicPort, path: "/remote/move" }
        });
    
        await messagebus.publish({ 
            username, 
            passphrase, 
            destPublicHost: broadcastHost, 
            destPublicPort: broadcastPort,
            sourcePublicHost, 
            sourcePublicPort,
            path: broadcastPath, 
            contentType, 
            content: { path: "/remote/move", contentType, content: entity }
        });
    }

    messagebus.subscribe({ sourcePublicHost, sourcePublicPort, sourcePrivatePort, path: "/", contentType: "text/html", isSecure: false }).callback = async () => {
        return fs.readFileSync("./entity.position.html","utf8");
    }

})().catch((err)=>{
    console.log(err);
});
