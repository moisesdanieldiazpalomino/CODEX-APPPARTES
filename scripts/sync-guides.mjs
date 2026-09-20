import { watch } from "node:fs";
import { link, readFile, rename, stat, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const paths = {
  agents: fileURLToPath(new URL("../AGENTS.md", import.meta.url)),
  claude: fileURLToPath(new URL("../Claude.md", import.meta.url)),
};

async function readGuide(name) {
  const [content, info] = await Promise.all([readFile(paths[name]), stat(paths[name])]);
  if (!info.isFile()) throw new Error(`${paths[name]} debe ser un archivo normal.`);
  return { content, info };
}

async function replaceWithHardLink(sourceName, targetName) {
  const target = paths[targetName];
  const backup = `${target}.sync-backup`;
  try {
    await stat(backup);
    throw new Error(`Existe ${backup}; resuélvelo antes de sincronizar.`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  await rename(target, backup);
  try {
    await link(paths[sourceName], target);
  } catch (error) {
    await rename(backup, target);
    throw error;
  }
  await unlink(backup);
}

export async function syncGuides(preferredSource) {
  const agents = await readGuide("agents");
  const claude = await readGuide("claude");
  const sameContent = agents.content.equals(claude.content);
  const sameFile = agents.info.dev === claude.info.dev && agents.info.ino === claude.info.ino;
  if (sameFile) return false;

  let source = preferredSource;
  if (!source) {
    if (sameContent) source = "agents";
    else if (agents.info.mtimeMs !== claude.info.mtimeMs) {
      source = agents.info.mtimeMs > claude.info.mtimeMs ? "agents" : "claude";
    } else {
      throw new Error("Las guías difieren y tienen la misma fecha. Usa --from=agents o --from=claude.");
    }
  }
  if (!(source in paths)) throw new Error("La fuente debe ser agents o claude.");
  const target = source === "agents" ? "claude" : "agents";
  await replaceWithHardLink(source, target);
  console.log(`Guías sincronizadas desde ${source === "agents" ? "AGENTS.md" : "Claude.md"}.`);
  return true;
}

export async function checkGuides() {
  const [agents, claude] = await Promise.all([readGuide("agents"), readGuide("claude")]);
  if (!agents.content.equals(claude.content)) {
    throw new Error("AGENTS.md y Claude.md difieren. Ejecuta npm run docs:sync.");
  }
  console.log("AGENTS.md y Claude.md son idénticos.");
}

export function watchGuides() {
  let timer;
  let queue = Promise.resolve();
  const watcher = watch(projectRoot, (_event, filename) => {
    const changed = filename?.toString().toLowerCase();
    if (changed !== "agents.md" && changed !== "claude.md") return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      queue = queue.then(() => syncGuides()).catch((error) => console.error(error));
    }, 150);
  });
  console.log("Vigilando AGENTS.md y Claude.md.");
  return watcher;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const option = process.argv[2];
  try {
    if (option === "--check") await checkGuides();
    else if (option === "--watch") {
      await syncGuides();
      watchGuides();
    } else if (!option || option === "--sync") await syncGuides();
    else if (option === "--from=agents" || option === "--from=claude") {
      await syncGuides(option.slice(7));
    } else throw new Error(`Opción desconocida: ${option}`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
