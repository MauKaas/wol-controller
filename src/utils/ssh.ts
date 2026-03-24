import { exec } from "child_process";

export function shutdownNode(ip: string, user: string): Promise<void> {
    return new Promise((resolve) => {
        exec(
            `ssh -o ConnectTimeout=5 ${user}@${ip} "sudo shutdown now"`,
            () => resolve()
        );
    });

}
    
export function isReachable(ip: string): Promise<boolean> {
    return new Promise((resolve) => {
        exec(`ping -c 1 -W 2 ${ip}`, (error) => resolve(!error));
    });
}