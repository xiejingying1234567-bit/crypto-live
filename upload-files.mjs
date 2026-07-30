import { readFileSync } from 'fs';

const TOKEN = `ghp_xxx`; // placeholder — 用浏览器认证方式替代

const OWNER = 'xiejingying1234567-bit';
const REPO = 'crypto-live';
const BRANCH = 'main';

const files = [
  'index.html',
  'manifest.json',
  'sw.js',
  'icon-192.svg',
  'icon-512.svg',
];

// 先获取 main 分支最新 commit SHA
async function getBranchSha() {
  const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`, {
    headers: { 'User-Agent': 'upload-script' }
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`getBranchSha: ${r.status} ${t}`);
  }
  const d = await r.json();
  return d.object.sha;
}

// 生成 tree
async function createTree(baseSha) {
  const entries = files.map(f => ({
    path: f,
    mode: '100644',
    type: 'blob',
    content: readFileSync(f, 'utf-8'),
  }));
  const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/trees`, {
    method: 'POST',
    headers: { 'User-Agent': 'upload-script', 'Content-Type': 'application/json' },
    body: JSON.stringify({ base_tree: baseSha, tree: entries })
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`createTree: ${r.status} ${t}`);
  }
  const d = await r.json();
  return d.sha;
}

// 创建 commit
async function createCommit(treeSha, parentSha) {
  const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/commits`, {
    method: 'POST',
    headers: { 'User-Agent': 'upload-script', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Initial commit: crypto live tracker',
      tree: treeSha,
      parents: [parentSha],
    })
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`createCommit: ${r.status} ${t}`);
  }
  const d = await r.json();
  return d.sha;
}

// 更新 reference
async function updateRef(commitSha) {
  const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    method: 'PATCH',
    headers: { 'User-Agent': 'upload-script', 'Content-Type': 'application/json' },
    body: JSON.stringify({ sha: commitSha, force: false })
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`updateRef: ${r.status} ${t}`);
  }
  const d = await r.json();
  return d;
}

async function main() {
  // 尝试不加认证（public repo 允许）
  console.log('Getting branch ref…');
  const baseSha = await getBranchSha();
  console.log('Base SHA:', baseSha);
  
  console.log('Creating tree…');
  const treeSha = await createTree(baseSha);
  console.log('Tree SHA:', treeSha);
  
  console.log('Creating commit…');
  const commitSha = await createCommit(treeSha, baseSha);
  console.log('Commit SHA:', commitSha);
  
  console.log('Updating ref…');
  const ref = await updateRef(commitSha);
  console.log('Done! Ref:', ref.ref, 'SHA:', ref.object.sha);
}

main().catch(e => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
