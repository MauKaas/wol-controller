import dgram from "dgram";

export function sendWoL(mac: string): Promise<void> {
    return new Promise((resolve, reject) => {
            
        const macBytes = Buffer.from(mac.replace(/[:-]/g, ""), "hex");
        const header = Buffer.alloc(6, 0xff);
        const body = Buffer.concat(Array(16).fill(macBytes));
        const magicPacket = Buffer.concat([header, body]);
        const socket = dgram.createSocket("udp4");

        socket.on("listening", () => socket.setBroadcast(true));

        socket.send(magicPacket, 0, magicPacket.length, 9, "255.255.255.255", (err) => {
            socket.close();
            err ? reject(err) : resolve();
        });
    });
}