import { exec } from "child_process";
function run(cmd: string): Promise<string> {
return new Promise((resolve, reject) => {
        exec(cmd, (error: any, stdout: any, stderr: any) => {
            error ? reject(new Error(stderr)) : resolve(stdout.trim());
        });
    });
}

export async function getAverageCPU(): Promise<number> {
  const output = await run("kubectl top nodes --no-headers");
  const lines = output.split("\n");
  let total = 0;
  let count = 0;

  for (const line of lines) {
    const cpu = parseInt(line.trim().split(/\s+/)[2]?.replace("%", "") || "");
    if (!isNaN(cpu)) {
      total += cpu;
      count++;
    }
  }

  return count > 0 ? total / count : 0;
}

export async function isNodeReady(name: string): Promise<boolean> {
    try {
        const output = await run(
        `kubectl get node ${name} -o jsonpath='{.status.conditions[-1].type}'`
        );
        return output.includes("Ready");
    } catch {
        return false;
    }
}

export async function drainNode(name: string): Promise<void> {
    await run(
        `kubectl drain ${name} --ignore-daemonsets --delete-emptydir-data --force --timeout=60s`
        );
    }
    
export async function uncordonNode(name: string): Promise<void> {
    await run(`kubectl uncordon ${name}`);
}