import config from "./config";
import { sendWoL } from "./utils/wol";
import { getAverageCPU, drainNode, uncordonNode, isNodeReady } from "./utils/kubectl";
import { shutdownNode, isReachable } from "./utils/ssh";

interface NodeState {
  name: string;
  mac: string;
  ip: string;
  sshUser: string;
  isAwake: boolean;
  lowSince: number | null;
  waking: boolean;
}

const nodes: NodeState[] = config.nodes.map((n) => ({
  ...n,
  isAwake: false,
  lowSince: null,
  waking: false,
}));

function log(msg: string) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function wakeNode(node: NodeState) {
  node.waking = true;
  log(`Waking ${node.name}...`);
  await sendWoL(node.mac);

  for (let i = 0; i < 12; i++) {
    await sleep(10000);
    if (await isNodeReady(node.name)) {
      await uncordonNode(node.name);
      log(`${node.name} is online!`);
      node.isAwake = true;
      node.waking = false;
      return;
    }
    log(`Waiting for ${node.name}...`);
  }

  log(`${node.name} did not come online in time`);
  node.waking = false;
}

async function sleepNode(node: NodeState) {
  log(`Sleeping ${node.name}...`);
  await drainNode(node.name);
  await shutdownNode(node.ip, node.sshUser);
  node.isAwake = false;
  node.lowSince = null;
  log(`${node.name} is now sleeping`);
}

async function tick() {
  try {
    const cpu = await getAverageCPU();
    const awake = nodes.filter((n) => n.isAwake);
    const sleeping = nodes.filter((n) => !n.isAwake && !n.waking);

    log(`CPU: ${cpu.toFixed(1)}% | Awake: ${awake.length}/${nodes.length}`);

    // Scale up
    if (cpu > config.scaleUpThreshold && sleeping.length > 0) {
      log(`CPU high -> waking ${sleeping[0]!.name}`);
      wakeNode(sleeping[0]!);
      return;
    }

    // Scale down
    if (cpu < config.scaleDownThreshold && awake.length > 0) {
      const target = awake[awake.length - 1]!;

      if (target.lowSince === null) {
        target.lowSince = Date.now();
        log(`CPU low, starting cooldown for ${target.name}`);
      } else {
        const elapsed = (Date.now() - target.lowSince) / 1000;
        if (elapsed >= config.cooldownSeconds) {
          await sleepNode(target);
        } else {
          log(`Cooldown: ${elapsed.toFixed(0)}s/${config.cooldownSeconds}s`);
        }
      }
      return;
    }

    // Reset cooldowns
    for (const node of awake) {
      if (node.lowSince !== null) {
        node.lowSince = null;
        log(`CPU normal, reset cooldown for ${node.name}`);
      }
    }
  } catch (err) {
    log(`Error: ${err}`);
  }
}

async function init() {
  log("WoL Controller starting...");

  for (const node of nodes) {
    node.isAwake =
      (await isReachable(node.ip)) && (await isNodeReady(node.name));
    log(`${node.name}: ${node.isAwake ? "online" : "offline"}`);
  }

  log("Monitoring...\n");
}

init().then(() => {
  setInterval(tick, config.checkIntervalSeconds * 1000);
  tick();
});
