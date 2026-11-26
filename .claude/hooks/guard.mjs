#!/usr/bin/env node
// PreToolUse guard for /shipit. Exit 2 = block (stderr is shown to Claude); 0 = allow.
//
// This is a seatbelt, not a sandbox: a determined command can always be
// spelled in a way a pattern misses. The real controls are the permission
// rules in settings.json (named scripts only, `git push` behind Claude
// Code's own prompt) and the orchestrator's read-only check. This hook
// catches the common destructive and secret-reading forms.
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
const tool = input.tool_name;
const ti = input.tool_input ?? {};

const block = (msg) => {
  process.stderr.write(`Blocked by /shipit guard: ${msg}\n`);
  process.exit(2);
};

// .env, .env.local, config/.env.production … but not .env.example / .env.sample / .env.template
const SECRET_FILE = /(^|[\s'"=\/])\.env(\.(?!example\b|sample\b|template\b)[\w.-]+)?(?=$|[\s'";|&)])/;
const KEY_FILE = /\.(pem|key|p12|pfx)(?=$|[\s'";|&)])|(^|[\s'"\/])id_(rsa|ed25519|ecdsa)\b/;

function checkPath(p, verb) {
  if (!p) return;
  if (SECRET_FILE.test(" " + p) || KEY_FILE.test(" " + p) || /(^|\/)secrets?\//.test(p)) {
    block(`${verb} secret file ${p}`);
  }
}

if (tool === "Read") checkPath(ti.file_path, "reading");
if (["Edit", "Write", "MultiEdit"].includes(tool)) checkPath(ti.file_path, "editing");

if (tool === "Bash") {
  const cmd = String(ti.command ?? "");
  // Split on shell separators so each simple command is checked on its own.
  const parts = cmd.split(/&&|\|\||;|\||\n|\$\(|`/).map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    const words = part.split(/\s+/);
    const bin = words[0]?.replace(/^.*\//, "");
    const flags = words.filter((w) => w.startsWith("-"));
    const shortFlags = flags.filter((f) => !f.startsWith("--")).join("");
    const has = (short, long) => shortFlags.includes(short) || flags.includes(long);

    // rm with recursive + force in any spelling: -rf, -fr, -r -f, -R -f, --recursive --force
    if (bin === "rm" && (has("r", "--recursive") || shortFlags.includes("R")) && has("f", "--force")) {
      block("recursive force delete (rm -rf and variants)");
    }
    if (bin === "find" && (words.includes("-delete") || /-exec\s+rm\b/.test(part))) block("find -delete / -exec rm");
    if (bin === "git") {
      const sub = words[1];
      if (sub === "push" && (has("f", "--force") || flags.some((f) => f.startsWith("--force")) || words.some((w) => w.startsWith("+")))) {
        block("force push");
      }
      if (sub === "push" && words.some((w) => /^(:|--delete$|-d$)/.test(w))) block("deleting a remote branch");
      if (sub === "reset" && flags.includes("--hard")) block("git reset --hard");
      if (sub === "clean" && has("f", "--force")) block("git clean -f");
      if (sub === "checkout" && words.includes("--") && words.includes(".")) block("git checkout -- . (discards all changes)");
      if (sub === "restore" && words.includes(".") && !flags.includes("--staged")) block("git restore . (discards all changes)");
      if (sub === "branch" && (flags.includes("-D") || (flags.includes("-d") && flags.includes("--force")))) block("force branch delete");
      if (sub === "rebase" || (sub === "filter-branch")) block(`git ${sub} rewrites history; ask the user`);
    }
    if (/^(mongo|mongosh)$/.test(bin) && /\b(drop(Database)?|deleteMany|remove)\s*\(/i.test(part)) block("destructive Mongo command");
    if (/^(psql|mysql|sqlite3)$/.test(bin) && /\b(drop|truncate)\s+(table|database|schema)\b/i.test(part)) block("destructive SQL");
    if (/^(npm|pnpm|yarn)$/.test(bin) && words.includes("publish")) block("package publish");
    if (bin === "chmod" && words.some((w) => /^-?R$/.test(w) || w === "-R") && words.includes("777")) block("chmod -R 777");
    if (/^(curl|wget)$/.test(bin) && /\|\s*(sh|bash|zsh)\b/.test(cmd)) block("piping a download into a shell");

    // Any command that names a secret file: cat, grep, sed, awk, node, python, source, cp …
    if (SECRET_FILE.test(" " + part) || KEY_FILE.test(" " + part)) block("command touches a secret file (.env / key)");
  }
}

process.exit(0);
