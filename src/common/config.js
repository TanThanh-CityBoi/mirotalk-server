'use strict';

const os = require('os');
const ifaces = os.networkInterfaces();

const getLocalIp = () => {
    let localIp = '127.0.0.1';
    Object.keys(ifaces).forEach((ifname) => {
        for (const iface of ifaces[ifname]) {
            // Ignore IPv6 and 127.0.0.1
            if (iface.family !== 'IPv4' || iface.internal !== false) {
                continue;
            }
            // Set the local ip to the first IPv4 address found and exit the loop
            localIp = iface.address;
            return;
        }
    });
    return localIp;
};

// https://api.ipify.org

module.exports = {
    /*
        Host Protection (default False)
        In order to protect your host set 
        hostProtected to true and set your own Username and Password
    */
    hostProtected: false,
    hostUsername: 'username',
    hostPassword: 'password',

    // app listen on
    listenIp: '0.0.0.0',
    listenPort: process.env.PORT || 3010,
    sslCrt: '../ssl/cert.pem',
    sslKey: '../ssl/key.pem',
    apiKeySecret: 'mirotalksfu_default_secret',
    sentry: {
        enabled: false,
        DSN: '',
        tracesSampleRate: 0.5,
    },
    
    // WebRtcTransport settings
    webRtcTransport: {
        listenIps: [
            {
                ip: '0.0.0.0',
                announcedIp: getLocalIp(), // replace by public static IP address https://api.ipify.org
            },
        ],
        initialAvailableOutgoingBitrate: 1000000,
        minimumAvailableOutgoingBitrate: 600000,
        maxSctpMessageSize: 262144,
        maxIncomingBitrate: 1500000,
    },
};
