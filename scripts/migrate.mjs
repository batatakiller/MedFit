// Script de migração — aplica todas as migrations no Supabase remoto via postgres direto
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({
  host: "147.15.99.72",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "vX2680eDloYFj9wgYasierkxzeNtq9Oj",
  ssl: false,
  connectionTimeoutMillis: 10000,
});

const migrationsDir = path.join(__dirname, "../supabase/migrations");
const seedFile = path.join(__dirname, "../supabase/seed.sql");

async function run() {
  console.log("Conectando ao banco...");
  await client.connect();
  console.log("✓ Conectado!\n");

  // Migrations em ordem
  const files = fs.readdirSync(migrationsDir).sort();
  for (const file of files) {
    if (!file.endsWith(".sql")) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`Aplicando ${file}...`);
    try {
      await client.query(sql);
      console.log(`  ✓ ${file} aplicado\n`);
    } catch (e) {
      if (
        e.message.includes("already exists") ||
        e.message.includes("já existe") ||
        e.code === "42P07" || // duplicate_table
        e.code === "42710" || // duplicate_object
        e.code === "42P16"    // invalid_table_definition (rls already enabled)
      ) {
        console.log(`  ⚠ ${file}: ${e.message.slice(0, 80)} (ignorado)`);
      } else {
        console.error(`  ✗ Erro em ${file}:`, e.message);
        // continua para tentar o próximo
      }
    }
  }

  // Seed
  if (fs.existsSync(seedFile)) {
    console.log("Aplicando seed.sql...");
    const seed = fs.readFileSync(seedFile, "utf8");
    // Executar statement por statement para melhor controle de erros
    const statements = seed.split(/;\s*\n/).filter((s) => s.trim());
    let ok = 0, skip = 0;
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;
      try {
        await client.query(trimmed + ";");
        ok++;
      } catch (e) {
        if (e.code === "23505" || e.message.includes("duplicate") || e.message.includes("already exists")) {
          skip++;
        } else {
          console.log(`  ⚠ seed: ${e.message.slice(0, 100)}`);
          skip++;
        }
      }
    }
    console.log(`  ✓ seed: ${ok} statements OK, ${skip} ignorados`);
  }

  await client.end();
  console.log("\n✅ Migração concluída!");
}

run().catch((e) => {
  console.error("Falha:", e.message);
  process.exit(1);
});
