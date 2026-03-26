export interface NodeConfig {
name: string;
mac: string;
ip: string;
sshUser: string;
}
const config = {
nodes: 
    [{
        name: "maurits-minion0",
        mac: "d8:9e:f3:7e:97:63", // change to real MAC
        ip: "192.168.0.101", // change to real IP
        sshUser: "mauflits",
    },
    {
        name: "maurits-minion1",
        mac: "d8:9e:f3:7e:9b:a3", // change to real MAC
        ip: "192.168.0.102", // change to real IP
        sshUser: "mauflits",
    }],
        scaleUpThreshold: 50, // wake node when CPU > X
        scaleDownThreshold: 10, // sleep node when CPU < X
        cooldownSeconds: 120, // X seconds low before sleeping
        checkIntervalSeconds: 10, // check every X sec
};

export default config;
