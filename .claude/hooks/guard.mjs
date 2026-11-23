#!/usr/bin/env node
// PreToolUse guard: blocks destructive shell commands and edits to secret files.
// Exit 2 = block (stderr is shown to Claude). Exit 0 = allow.
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
const tool = input.tool_name;
const ti = input.tool_input ?? {};

const block = (msg) => {
  process.stderr.write(`Blocked by guard hook: ${msg}\n`);
  process.exit(2);
};

if (tool === "Bash") {
  const cmd = ti.command ?? "";
  const rules = [
    [/\bgit\s+push\b/, "git push requires human approval — ask the user"],
    [/\bgit\s+reset\s+--hard\b/, "git reset --hard is destructive"],
    [/\bgit\s+clean\s+-[a-z]*f/, "git clean -f is destructive"],
    [/\brm\s+-[a-z]*r[a-z]*f|\brm\s+-[a-z]*f[a-z]*r/, "rm -rf is not allowed"],
    [/\b(mongo|mongosh)\b.*(drop|deleteMany)/i, "destructive Mongo command"],
    [/\bnpm\s+publish\b/, "npm publish is not allowed"],
    [/(^|\s)(cat|less|head|tail)\s+[^|]*\.env\b/, "reading .env files is not allowed"],
  ];
  for (const [re, msg] of rules) if (re.test(cmd)) block(msg);
}

if (["Edit", "Write", "MultiEdit"].includes(tool)) {
  const p = ti.file_path ?? "";
  if (/(^|\/)\.env(\.|$)/.test(p) || /(^|\/)secrets?\//.test(p) || /\.(pem|key)$/.test(p)) {
    block(`editing secret file ${p}`);
  }
}

process.exit(0);
