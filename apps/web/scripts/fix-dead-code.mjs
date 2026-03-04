import fs from "fs";
import path from "path";

const diagnosticsPath =
  "C:\\Users\\signo\\AppData\\Local\\Temp\\react-doctor-4461f90c-b4c6-4124-9f78-9be2e0e85a73\\diagnostics.json";
const diagnostics = JSON.parse(fs.readFileSync(diagnosticsPath, "utf8"));

const cwd =
  "C:\\Users\\signo\\OneDrive\\Documents\\freelance\\turborepo\\inventory-sales\\apps\\web";

const editsByFile = new Map();

for (const d of diagnostics) {
  if (d.category === "Dead Code") {
    let name = "";
    let isType = false;
    if (d.message.startsWith("Unused export: ")) {
      name = d.message.replace("Unused export: ", "").trim();
    } else if (d.message.startsWith("Unused type: ")) {
      name = d.message.replace("Unused type: ", "").trim();
      isType = true;
    }

    if (name) {
      if (!editsByFile.has(d.filePath)) {
        editsByFile.set(d.filePath, []);
      }
      editsByFile.get(d.filePath).push({ name, isType });
    }
  }
}

for (const [relPath, edits] of editsByFile.entries()) {
  const absPath = path.join(cwd, relPath);
  if (!fs.existsSync(absPath)) continue;

  let content = fs.readFileSync(absPath, "utf8");
  let changed = false;

  for (const { name, isType } of edits) {
    // Regex to match `export const Name` or `export type Name` or `export interface Name`
    // or `export function Name`

    // 1. Named export inside a bulk export: `export { A, B, C }`
    const bulkExportRegex = new RegExp(
      `export\\s*{([^}]*)\\b${name}\\b([^}]*)}`,
      "g",
    );
    content = content.replace(bulkExportRegex, (match, prefix, suffix) => {
      changed = true;
      let newInner = (prefix + suffix)
        .replace(/,\s*,/g, ",")
        .replace(/^,\s*/, "")
        .replace(/,\s*$/, "")
        .trim();
      if (!newInner) return ""; // remove entire export {}
      return `export { ${newInner} }`;
    });

    // 2. Direct export declarations
    const directExportRegex = new RegExp(
      `export\\s+(const|let|var|function|async\\s+function|type|interface|class)\\s+(${name})\\b`,
      "g",
    );
    content = content.replace(
      directExportRegex,
      (match, typeKeyword, identifier) => {
        changed = true;
        return `${typeKeyword} ${identifier}`;
      },
    );
  }

  if (changed) {
    fs.writeFileSync(absPath, content, "utf8");
    console.log(`Updated ${relPath}`);
  }
}
