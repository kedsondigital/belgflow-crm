#!/usr/bin/env node
/**
 * Script para preparar o pacote de deploy na Hostinger.
 * Roda: npm run build + empacota standalone em ZIP.
 * Uso: node scripts/prepare-hostinger.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

const ROOT = path.resolve(__dirname, '..');
const DEPLOY_DIR = path.join(ROOT, 'hostinger-deploy');
const ZIP_PATH = path.join(ROOT, 'belgflow-crm-hostinger.zip');

function rm(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
}

function cp(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      cp(path.join(src, entry.name), path.join(dest, entry.name));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function addDirToArchive(archive, dir, prefix = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const archivePath = (prefix ? path.join(prefix, entry.name) : entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      addDirToArchive(archive, fullPath, archivePath);
    } else {
      archive.file(fullPath, { name: archivePath });
    }
  }
}

async function main() {
console.log('🔨 Rodando npm run build...');
execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });

const standaloneDir = path.join(ROOT, '.next', 'standalone');
const staticDir = path.join(ROOT, '.next', 'static');
const publicDir = path.join(ROOT, 'public');

if (!fs.existsSync(standaloneDir)) {
  console.error('❌ .next/standalone não encontrado. Verifique se next.config tem output: "standalone"');
  process.exit(1);
}

console.log('📦 Preparando pasta hostinger-deploy...');
rm(DEPLOY_DIR);
fs.mkdirSync(DEPLOY_DIR, { recursive: true });

cp(standaloneDir, DEPLOY_DIR);
cp(staticDir, path.join(DEPLOY_DIR, '.next', 'static'));

if (fs.existsSync(publicDir)) {
  cp(publicDir, path.join(DEPLOY_DIR, 'public'));
}

const deployPackageJson = {
  name: 'belgflow-crm',
  version: '1.0.0',
  private: true,
  scripts: {
    start: 'node server.js',
  },
  engines: {
    node: '>=18',
  },
};
fs.writeFileSync(
  path.join(DEPLOY_DIR, 'package.json'),
  JSON.stringify(deployPackageJson, null, 2)
);

console.log('📁 Criando ZIP...');
rm(ZIP_PATH);

await new Promise((resolve, reject) => {
  const out = fs.createWriteStream(ZIP_PATH);
  const archive = archiver('zip', { zlib: { level: 9 } });
  out.on('close', resolve);
  archive.on('error', reject);
  archive.pipe(out);
  addDirToArchive(archive, DEPLOY_DIR);
  archive.finalize();
}).catch((err) => {
  console.error('Erro ao criar ZIP:', err);
  process.exit(1);
});

rm(DEPLOY_DIR);

console.log('');
console.log('✅ Pronto! Arquivo gerado: belgflow-crm-hostinger.zip');
console.log('');
console.log('📤 Próximos passos:');
console.log('   1. Acesse hPanel da Hostinger → Node.js');
console.log('   2. Faça upload do ZIP belgflow-crm-hostinger.zip');
console.log('   3. Configure as variáveis de ambiente (Supabase, etc.)');
console.log('   4. Comando de start: node server.js');
console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
