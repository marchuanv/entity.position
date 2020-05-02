const messagebus = require("messagebus");
const fs = require("fs");
const componentSecure = require("component.secure");

const sourcePrivatePort = Number(process.env.PORT || 4000);
const sourcePublicHost = process.env.PUB_HOST || "localhost";
const sourcePublicPort = Number(process.env.PUB_PORT || sourcePrivatePort);

const broadcastHost = process.env.BROADCAST_HOST || sourcePublicHost;
const broadcastPort = Number(process.env.BROADCAST_PORT || 5000);


const username = process.env.USERNAME || "anonymous";
const passphrase = process.env.PASSPHRASE || "secure1";

const logging = require("logging");
logging.config([
    "Entity Position",
    "Entity Registration",
    "MessageBus",
    "MessageBus Publisher",
    "MessageBus Subscriber",
    "Component Client",
    "Component Server",
    "Component Secure Client",
    "Component Secure Server"
]);

const hashPassphrase = (username, passphrase) => {
    const { hashedPassphrase, salt } = componentSecure.http.secure.hashPassphrase(passphrase);
    return {username, hashedPassphrase, hashedPassphraseSalt: salt };
}

(async () => {

    messagebus.subscribe({ id: "RegisterUser", username: "registeruser", passphrase: "unsecure1", 
        address: { 
            channel: "register",
            from: { private: { host: "localhost", port: sourcePrivatePort },public: { host: sourcePublicHost, port: sourcePublicPort }}
        },
        contentType: "application/json",
        callback: ({ username, passphrase }) => {
            logging.write("Entity Registration",`registering user ${username}`);
            messagebus.subscribe({ id: "RemoteEntityPosition", username, passphrase, 
                address: { 
                    channel: "remoteentity",
                    from: { private: { host: "localhost", port: sourcePrivatePort },public: { host: sourcePublicHost, port: sourcePublicPort }}
                },
                contentType: "application/json",
                callback: ({ name, position }) => {
                    logging.write("Entity Position",`remote entity ${name} has moved`, position);
                }
            });
            messagebus.subscribe({ id: "LocalEntityPosition", username, passphrase, 
                address: { 
                    channel: "localentity",
                    from: { private: { host: "localhost", port: sourcePrivatePort },public: { host: sourcePublicHost, port: sourcePublicPort }}
                },
                contentType: "application/json",
                callback: async ({ name, position }) => {
                    logging.write("Entity Position",`local entity ${name} has moved`, position);
                    await messagebus.publish({ id: "register", username, passphrase, address:  { 
                            channel: "broadcastregister", 
                            from: { private: { host: "localhost", port: sourcePrivatePort },
                                    public: { host: sourcePublicHost, port: sourcePublicPort }
                            },
                            to: { private: { host: "localhost", port: 999999999},
                                    public: { host: broadcastHost, port: broadcastPort }
                            }
                        },
                        contentType: "application/json",
                        content: { host: sourcePublicHost,  port: sourcePublicPort, channel: "remoteentity" }
                    });
                    await messagebus.publish({ id: "broadcast", username, passphrase, address:  { 
                            channel: "broadcast", 
                            from: { private: { host: "localhost", port: sourcePrivatePort },
                                    public: { host: sourcePublicHost, port: sourcePublicPort }
                            },
                            to: { private: { host: "localhost", port: 999999999},
                                    public: { host: broadcastHost, port: broadcastPort }
                            }
                        },
                        contentType: "application/json",
                        content: { channel: "remoteentity", contentType: "application/json", content: {name, position} }
                    });
                }
            });
        }
    });
    messagebus.subscribe({ id: "index", username, passphrase, isSecure: false,
        address: { 
            channel: "index",
            from: { private: { host: "localhost", port: sourcePrivatePort }, public: { host: sourcePublicHost, port: sourcePublicPort }}
        },
        contentType: "text/html",
        callback: () => {
            return fs.readFileSync("./entity.position.html","utf8");
        }
    });

})().catch((err)=>{
    console.log(err);
});
