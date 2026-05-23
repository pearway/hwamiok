// 화미옥 어드민 — content.json 편집 + GitHub 직접 push or 다운로드
// 상태
let content = null;
let pendingImageUploads = {}; // key → { file, dataUrl, newPath }
let mode = 'github'; // 'github' or 'offline'
let gh = { owner: '', repo: '', branch: 'main', token: '' };

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => root.querySelectorAll(sel);

// ============ LOGIN ============
window.addEventListener('DOMContentLoaded', () => {
  // 저장된 자격증명 복원
  const saved = localStorage.getItem('hwamiok-admin-auth');
  if (saved) {
    try {
      const { owner, repo, branch, token } = JSON.parse(saved);
      $('#gh-repo').value = owner && repo ? `${owner}/${repo}` : '';
      $('#gh-branch').value = branch || 'main';
      $('#gh-token').value = token || '';
    } catch (e) {}
  }

  $('#login-btn').addEventListener('click', loginGithub);
  $('#login-offline').addEventListener('click', loginOffline);
  $('#save-btn').addEventListener('click', saveAll);
  $('#reload-btn').addEventListener('click', () => location.reload());
  $('#logout-btn').addEventListener('click', () => {
    localStorage.removeItem('hwamiok-admin-auth');
    location.reload();
  });

  // 탭 활성화
  $$('.editor__tabs a').forEach(a => {
    a.addEventListener('click', e => {
      $$('.editor__tabs a').forEach(x => x.classList.remove('active'));
      a.classList.add('active');
    });
  });
});

async function loginGithub() {
  const repoFull = $('#gh-repo').value.trim();
  const branch = $('#gh-branch').value.trim() || 'main';
  const token = $('#gh-token').value.trim();

  if (!repoFull || !repoFull.includes('/')) {
    return showLoginMsg('Repo 형식이 잘못됨 (owner/repo)', 'error');
  }
  if (!token) {
    return showLoginMsg('GitHub 토큰을 입력하세요', 'error');
  }

  const [owner, repo] = repoFull.split('/');
  gh = { owner, repo, branch, token };
  mode = 'github';

  showLoginMsg('연결 확인 중...', '');
  $('#login-btn').disabled = true;

  try {
    // 1. Verify token + repo access
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!r.ok) throw new Error('Repo 접근 실패. 토큰 권한 확인 (repo scope 필요)');

    // 2. Fetch content.json
    const cr = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/content.json?ref=${branch}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!cr.ok) throw new Error('content.json 파일을 찾을 수 없음 (repo 루트에 있어야 함)');

    const cdata = await cr.json();
    content = JSON.parse(atob(cdata.content.replace(/\n/g, '')));
    content.__sha = cdata.sha;

    localStorage.setItem('hwamiok-admin-auth', JSON.stringify(gh));
    enterEditor();
  } catch (e) {
    showLoginMsg('실패: ' + e.message, 'error');
    $('#login-btn').disabled = false;
  }
}

async function loginOffline() {
  mode = 'offline';
  showLoginMsg('content.json 로컬에서 불러오는 중...', '');

  try {
    // 기본 content.json 불러오기 (사이트와 같은 경로)
    const r = await fetch('../content.json?t=' + Date.now());
    if (!r.ok) throw new Error('content.json을 찾을 수 없음');
    content = await r.json();
    enterEditor();
  } catch (e) {
    showLoginMsg('실패: ' + e.message + '. 직접 업로드 필요', 'error');
  }
}

function showLoginMsg(msg, type) {
  const el = $('#login-msg');
  el.textContent = msg;
  el.className = type || '';
}

// ============ ENTER EDITOR ============
function enterEditor() {
  $('#login').classList.add('hidden');
  $('#editor').classList.remove('hidden');
  $('#repo-info').textContent = mode === 'github'
    ? `→ ${gh.owner}/${gh.repo} (${gh.branch})`
    : '→ 로컬 모드 (다운로드)';
  populateForm();
}

// ============ POPULATE FORM ============
function populateForm() {
  // 단순 키들 (data-key="hero.title" 등)
  $$('[data-key]').forEach(el => {
    const key = el.dataset.key;
    const val = getNested(content, key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      if (el.type === 'datetime-local' && val) {
        el.value = val.replace(/\.\d+Z?$/, '').slice(0, 16);
      } else {
        el.value = val || '';
      }
    } else if (el.classList.contains('img-slot')) {
      renderImgSlot(el, val);
    }
  });

  // Menu Carousel (배열)
  const mcGrid = $('#menu-carousel-grid');
  mcGrid.innerHTML = '';
  (content.menuCarousel || []).forEach((item, i) => {
    mcGrid.appendChild(makeItemCard('menuCarousel', i, item, ['name']));
  });

  // Ingredient — 이미지 + Vimeo ID 둘 다
  const igGrid = $('#ingredient-grid');
  igGrid.innerHTML = '';
  (content.ingredient || []).forEach((item, i) => {
    igGrid.appendChild(makeItemCard('ingredient', i, item, ['name', 'vimeoId']));
  });

  // Signature (image + Vimeo ID + alt)
  const sgGrid = $('#signature-grid');
  sgGrid.innerHTML = '';
  (content.signature || []).forEach((item, i) => {
    sgGrid.appendChild(makeItemCard('signature', i, item, ['alt', 'vimeoId']));
  });

  // Popups (3개)
  const pList = $('#popups-list');
  if (pList) {
    pList.innerHTML = '';
    if (!content.popups) content.popups = [];
    while (content.popups.length < 3) content.popups.push({enabled:false});
    content.popups.forEach((item, i) => {
      pList.appendChild(makePopupCard(i, item));
    });
  }

  // change 이벤트: input/textarea 변경 → content 객체 업데이트
  $$('[data-key]').forEach(el => {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.addEventListener('input', () => {
        let val = el.value;
        if (el.type === 'datetime-local' && val) val += ':00';
        setNested(content, el.dataset.key, val);
      });
    }
  });
}

function makePopupCard(index, item) {
  const card = document.createElement('div');
  card.className = 'popup-card';
  card.style.cssText = 'border:1px solid rgba(212,21,26,.2); border-radius:4px; padding:18px 20px; margin-bottom:14px; background:#fafafa; display:flex; align-items:center; justify-content:space-between; gap:16px;';

  const name = item.name || `팝업 ${index + 1}`;
  const descriptions = [
    '빨간 배경 — 업종변경 매출 3배 UP, 가맹비 0원 혜택 4개',
    '검정 배경 — 가맹점 현황 (가맹상담중 20 / 오픈예정 5)',
    '크림 배경 — 창업설명회 안내 (일정/장소/신청)'
  ];
  card.innerHTML = `
    <div>
      <strong style="color:#d4151a;font-size:15px;display:block;margin-bottom:4px;">팝업 ${index + 1}</strong>
      <span style="color:#666;font-size:13px;">${descriptions[index] || ''}</span>
    </div>
    <label style="font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;">
      <input type="checkbox" class="popup-enabled" ${item.enabled !== false ? 'checked' : ''} style="margin-right:6px;"> 표시
    </label>
  `;

  card.querySelector('.popup-enabled').addEventListener('change', e => {
    content.popups[index].enabled = e.target.checked;
  });

  return card;
}
function escAttr(v){return v == null ? '' : String(v).replace(/"/g,'&quot;').replace(/</g,'&lt;');}

function makeItemCard(section, index, item, fields) {
  const card = document.createElement('div');
  card.className = 'item-card';

  const label = document.createElement('div');
  label.className = 'item-label';
  label.textContent = `${section} #${String(index + 1).padStart(2, '0')}`;
  card.appendChild(label);

  // 이미지
  const imgSlot = document.createElement('div');
  imgSlot.className = 'img-slot';
  const slotKey = `${section}[${index}].image`;
  imgSlot.dataset.key = slotKey;
  renderImgSlot(imgSlot, item.image);
  card.appendChild(imgSlot);

  // text 필드
  fields.forEach(f => {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.value = item[f] || '';
    if (f === 'vimeoId') inp.placeholder = 'Vimeo ID (예: 1194719878)';
    else inp.placeholder = f;
    inp.style.marginTop = '8px';
    inp.addEventListener('input', () => {
      content[section][index][f] = inp.value;
    });
    card.appendChild(inp);
  });

  return card;
}

// ============ IMAGE SLOT ============
function renderImgSlot(el, currentPath) {
  el.innerHTML = '';
  const key = el.dataset.key;
  const pending = pendingImageUploads[key];

  if (pending && pending.dataUrl) {
    const img = document.createElement('img');
    img.src = pending.dataUrl;
    el.appendChild(img);

    const badge = document.createElement('div');
    badge.className = 'img-slot__changed';
    badge.textContent = '변경됨';
    el.appendChild(badge);
  } else if (currentPath) {
    const img = document.createElement('img');
    // 어드민에서 사이트 이미지 보려면 상대 경로 변환
    img.src = currentPath.startsWith('http') ? currentPath : '../' + currentPath;
    img.onerror = () => {
      el.innerHTML = `<div class="img-slot__placeholder">이미지 없음<br><small>${currentPath}</small></div>`;
      addFileInput(el);
    };
    el.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'img-slot__placeholder';
    ph.textContent = '클릭해서 업로드';
    el.appendChild(ph);
  }

  addFileInput(el);
}

function addFileInput(el) {
  const fi = document.createElement('input');
  fi.type = 'file';
  fi.accept = 'image/*';
  fi.addEventListener('change', e => handleFileSelect(e, el));
  el.appendChild(fi);
}

async function handleFileSelect(e, el) {
  const file = e.target.files[0];
  if (!file) return;
  const key = el.dataset.key;

  const dataUrl = await readFileAsDataURL(file);

  // 파일명 (기존 경로 기반으로 새 파일명 결정)
  const ext = file.name.match(/\.[^.]+$/)?.[0] || '.jpg';
  const ts = Date.now();
  const newPath = `images/upload-${key.replace(/[.\[\]]/g, '_')}-${ts}${ext}`;

  pendingImageUploads[key] = { file, dataUrl, newPath };
  // content 객체 업데이트
  if (key.includes('[')) {
    // 배열 항목 (e.g. menuCarousel[3].image or popups[0].image)
    const m = key.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
    if (m) {
      if (!content[m[1]]) content[m[1]] = [];
      if (!content[m[1]][parseInt(m[2])]) content[m[1]][parseInt(m[2])] = {};
      content[m[1]][parseInt(m[2])][m[3]] = newPath;
    }
  } else {
    setNested(content, key, newPath);
  }

  renderImgSlot(el, newPath);
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// ============ SAVE ============
async function saveAll() {
  const btn = $('#save-btn');
  btn.disabled = true;
  toast('저장 중...', '');

  try {
    // __sha 제거 (저장 전)
    const toSave = { ...content };
    delete toSave.__sha;

    if (mode === 'github') {
      await saveToGitHub(toSave);
      toast('✓ GitHub에 저장됨. Vercel 자동 배포 중 (1~2분).', 'success');
    } else {
      await saveAsDownload(toSave);
      toast('✓ ZIP 다운로드 시작. 압축 풀고 git에 commit + push 하세요.', 'success');
    }
    pendingImageUploads = {};
    setTimeout(() => location.reload(), 2000);
  } catch (e) {
    console.error(e);
    toast('실패: ' + e.message, 'error');
    btn.disabled = false;
  }
}

async function saveToGitHub(toSave) {
  // 1. 새 이미지들 업로드
  for (const key in pendingImageUploads) {
    const { newPath, dataUrl } = pendingImageUploads[key];
    const base64 = dataUrl.split(',')[1];
    toast(`이미지 업로드: ${newPath}`, '');
    await ghPutFile(newPath, base64, `Update image: ${newPath}`);
  }

  // 2. content.json 업데이트
  const newJson = JSON.stringify(toSave, null, 2);
  const base64Json = btoa(unescape(encodeURIComponent(newJson)));
  toast('content.json 저장 중...', '');
  await ghPutFile('content.json', base64Json, '✏️ Update content.json from admin', content.__sha);
}

async function ghPutFile(path, contentBase64, message, sha) {
  const url = `https://api.github.com/repos/${gh.owner}/${gh.repo}/contents/${path}`;
  // 기존 파일 체크 → sha 가져오기 (덮어쓰기 시 필요)
  if (!sha) {
    try {
      const exr = await fetch(url + `?ref=${gh.branch}`, {
        headers: { 'Authorization': `Bearer ${gh.token}` }
      });
      if (exr.ok) {
        const ex = await exr.json();
        sha = ex.sha;
      }
    } catch (e) {}
  }

  const body = {
    message,
    content: contentBase64,
    branch: gh.branch
  };
  if (sha) body.sha = sha;

  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${gh.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const err = await r.json();
    throw new Error(`${path} 업로드 실패: ${err.message}`);
  }
  return r.json();
}

async function saveAsDownload(toSave) {
  // JSZip 동적 로드
  if (!window.JSZip) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
  }
  const zip = new JSZip();
  zip.file('content.json', JSON.stringify(toSave, null, 2));

  const imagesFolder = zip.folder('images');
  for (const key in pendingImageUploads) {
    const { dataUrl, newPath } = pendingImageUploads[key];
    const base64 = dataUrl.split(',')[1];
    const filename = newPath.replace(/^images\//, '');
    imagesFolder.file(filename, base64, { base64: true });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `hwamiok-content-${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

// ============ UTILS ============
function getNested(obj, path) {
  return path.split('.').reduce((o, k) => o ? o[k] : undefined, obj);
}
function setNested(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => o[k] = o[k] || {}, obj);
  target[last] = value;
}
function toast(msg, type) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show ' + (type || '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 5000);
}
