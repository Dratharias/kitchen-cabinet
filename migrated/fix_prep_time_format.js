#!/usr/bin/env node
/**
 * Corrige les payloads contenant des "prep_time": {...}
 * Usage :
 *   node fix_prep_time_format.js mojito.json
 *   node fix_prep_time_format.js ./payloads/
 */

import fs from "fs";
import path from "path";

function normalizePrepTime(obj) {
  if (!obj || typeof obj !== "object") return obj;

  // Corrige si l'objet est de la forme { prep_time: {...} }
  if (obj.prep_time && typeof obj.prep_time === "object") {
    return normalizePrepTime(obj.prep_time);
  }

  // Descend récursivement dans les objets et tableaux
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (Array.isArray(val)) {
      obj[key] = val.map((v) => normalizePrepTime(v));
    } else if (typeof val === "object" && val !== null) {
      obj[key] = normalizePrepTime(val);
    }
  }

  return obj;
}

function processFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const fixed = normalizePrepTime(structuredClone(data));
  fs.writeFileSync(filePath, JSON.stringify(fixed, null, 2));
  console.log(`✔ corrigé : ${path.basename(filePath)}`);
}

function run(target) {
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    const files = fs.readdirSync(target).filter((f) => f.endsWith(".json"));
    for (const f of files) processFile(path.join(target, f));
  } else {
    processFile(target);
  }
}

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node fix_prep_time_format.js <fichier.json|dossier>");
  process.exit(1);
}

run(path.resolve(arg));
