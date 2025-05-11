// ▼ 要素取得
const uploadSection = document.getElementById('uploadSection');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');

const progressArea = document.getElementById('progressArea');
const uploadedInfo = document.getElementById('uploadedInfo');
const progressBar = document.getElementById('progressBar');

const postContainer = document.getElementById('postContainer');
const descriptionInput = document.getElementById('descriptionInput');
const previewText = document.getElementById('previewText');
const replaceBtn = document.getElementById('replaceBtn');
const submitBtn = document.getElementById('submitBtn');

const replaceBtnInProgress = document.getElementById('replaceBtnInProgress');
const previewVideo = document.getElementById('previewVideo');

const workSelectionBlock = document.getElementById('workSelectionBlock');
const workSearchBtn = document.getElementById('workSearchBtn');
const workSearchInput = document.getElementById('workSearchInput');
const workList = document.getElementById('workList');
const confirmWorkBtn = document.getElementById('confirmWorkBtn');
const selectWorkButtonArea = document.getElementById('selectWorkButtonArea');

const episodeConfirmModal = document.getElementById('episodeConfirmModal');
const selectedWorkTitle = document.getElementById('selectedWorkTitle');
const goAddEpisodeBtn = document.getElementById('goAddEpisodeBtn');
const skipEpisodeBtn = document.getElementById('skipEpisodeBtn');

const episodeSelectModal = document.getElementById('episodeSelectModal');
const episodeList = document.getElementById('episodeList');
const decideEpisodeBtn = document.getElementById('decideEpisodeBtn');

const selectedContainer = document.getElementById('selectedContainer');
const selectedStatusText = document.getElementById('selectedStatusText');
const rechooseBtn = document.getElementById('rechooseBtn');

let uploadedFile = null;
let selectedWorkId = null;
let selectedWorkTitleText = '';
let selectedEpisodeId = null;
let selectedEpisodeTitle = '';

// 初期化: 検索フォームを非表示
workSelectionBlock.style.display = 'none';

// =============================
// (1) 動画アップロード処理
// =============================
uploadSection.addEventListener('dragover', handleDragOver);
uploadSection.addEventListener('dragleave', handleDragLeave);
uploadSection.addEventListener('drop', handleFileDrop);
selectBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileInput);
replaceBtnInProgress.addEventListener('click', resetUploadForm);
descriptionInput.addEventListener('input', updatePreviewText);
submitBtn.addEventListener('click', async () => {
  if (!uploadedFile) {
    alert('動画ファイルがありません');
    return;
  }
  submitBtn.disabled = true;
  submitBtn.textContent = '投稿中...';

  try {
    // サーバーへ動画とメタデータを送信
    const formData = new FormData();
    formData.append('shortVideo', uploadedFile);
    // hidden inputから値を取得して送信
    formData.append('title', document.getElementById('hiddenWorkTitle')?.value || selectedWorkTitleText || '作品投稿');
    formData.append('episodeTitle', document.getElementById('hiddenEpisodeTitle')?.value || selectedEpisodeTitle || '');
    formData.append('description', descriptionInput.value.trim());
    const tags = descriptionInput.value.trim().match(/#\w+/g)?.map(t => t.replace('#','')).join(',') || '';
    formData.append('tags', tags);
    if (selectedWorkId) formData.append('workId', selectedWorkId);
    if (selectedEpisodeId) formData.append('episodeId', selectedEpisodeId);
    // durationは必要に応じて
    formData.append('duration', Math.round(uploadedFile.duration || 0));

    const res = await fetch('/shorts', {
      method: 'POST',
      body: formData
    });
    if (res.redirected) {
      window.location.href = res.url;
      return;
    }
    if (!res.ok) throw new Error('サーバーエラー');
    // 念のためJSON返却にも対応
    const result = await res.json();
    window.location.href = '/shorts/' + result._id;
  } catch (err) {
    alert('投稿に失敗しました: ' + err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = '投稿する';
  }
});

function handleDragOver(e) {
  e.preventDefault();
  uploadSection.classList.add('dragover');
}

function handleDragLeave() {
  uploadSection.classList.remove('dragover');
}

function handleFileDrop(e) {
  e.preventDefault();
  uploadSection.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files.length) {
    handleFileSelected(e.dataTransfer.files[0]);
  }
}

function handleFileInput(e) {
  if (e.target.files && e.target.files.length) {
    handleFileSelected(e.target.files[0]);
  }
}

function resetUploadForm() {
  postContainer.style.display = 'none';
  progressArea.style.display = 'none';
  progressBar.style.width = '0%';
  uploadedInfo.textContent = '';
  uploadSection.style.display = 'block';
  fileInput.value = '';
  uploadedFile = null;
  workSelectionBlock.style.display = 'none';
  descriptionInput.value = '';
  previewText.textContent = '';
}

function updatePreviewText() {
  previewText.textContent = descriptionInput.value;
}

function handleFileSelected(file) {
  
  uploadedFile = file;

  uploadSection.style.display = 'none';
  progressArea.style.display = 'block';
  postContainer.style.display = 'flex';

  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
  uploadedInfo.textContent = `${file.name} (${sizeMB}MB) - アップロード中...`;

  simulateProgress(file, sizeMB);
  setupVideoPreview(file);
}

function simulateProgress(file, sizeMB) {
  
  progressBar.style.width = '0%';
  let loaded = 0;
  const total = file.size;
  const interval = setInterval(() => {
    loaded += total / 50;
    const percent = Math.min((loaded / total) * 100, 100);
    progressBar.style.width = percent + '%';
    if (percent >= 100) {
      clearInterval(interval);
      uploadedInfo.textContent = `${file.name} (${sizeMB}MB) - アップロード完了`;
      workSelectionBlock.style.display = 'block';
      document.getElementById('submitButtonContainer').style.display = 'block';
    }
  }, 100);
}

function setupVideoPreview(file) {
  const videoURL = URL.createObjectURL(file);
  previewVideo.src = videoURL;

  previewVideo.addEventListener('loadedmetadata', () => {
    const vw = previewVideo.videoWidth;
    const vh = previewVideo.videoHeight;

    if (!vw || !vh) return;

    const aspect = vw / vh;

    if (aspect > 1) {
      previewVideo.style.width = '100%';
      previewVideo.style.height = 'auto';
    } else {
      previewVideo.style.width = 'auto';
      previewVideo.style.height = '100%';
    }

    previewVideo.style.position = 'absolute';
    previewVideo.style.top = '50%';
    previewVideo.style.left = '50%';
    previewVideo.style.transform = 'translate(-50%, -50%)';
  });

  previewVideo.addEventListener('click', () => {
    if (previewVideo.paused) {
      previewVideo.play();
    } else {
      previewVideo.pause();
    }
  });
}

// =============================
// (2) 作品検索処理
// =============================
workSearchBtn.addEventListener('click', async () => {
  const keyword = workSearchInput.value.trim();
  if (!keyword) {
    alert('検索ワードを入力してください');
    return;
  }
  try {
    const res = await fetch(`/api/works?q=${encodeURIComponent(keyword)}`);
    if (!res.ok) throw new Error('サーバーエラー');
    const works = await res.json();
    renderWorkCards(works);
  } catch (err) {
    alert('作品検索に失敗しました');
    console.error(err);
  }
});

function renderWorkCards(worksData) {
  workList.innerHTML = '';
  confirmWorkBtn.disabled = true;
  selectWorkButtonArea.style.display = 'none';

  if (!worksData || worksData.length === 0) {
    workList.innerHTML = '<p>該当作品がありません</p>';
    return;
  }

  worksData.forEach(w => {
    const card = document.createElement('div');
    card.classList.add('work-card');
    const thumb = w.thumbnailUrl || '/img/no_thumbnail.png';
    card.innerHTML = `
      <img src="${thumb}" class="work-card-thumb" alt="${w.title}">
      <div class="work-card-info">
        <h4>${w.title}</h4>
      </div>
    `;
    card.addEventListener('click', () => {
      document.querySelectorAll('.work-card.selected')
              .forEach(el => el.classList.remove('selected'));
      card.classList.add('selected');
      selectedWorkId = w._id;
      selectedWorkTitleText = w.title;
      confirmWorkBtn.disabled = false;
    });
    workList.appendChild(card);
  });

  selectWorkButtonArea.style.display = 'block';
}

// =============================
// (3) 作品確定モーダル
// =============================
confirmWorkBtn.addEventListener('click', () => {
  
  if (!selectedWorkId) return;
  selectedWorkTitle.textContent = `『${selectedWorkTitleText}』が選択されました`;
  episodeConfirmModal.style.display = 'flex';
});

goAddEpisodeBtn.addEventListener('click', () => {
  
  episodeConfirmModal.style.display = 'none';
  openEpisodeSelect();
});

skipEpisodeBtn.addEventListener('click', () => {
  
  episodeConfirmModal.style.display = 'none';
  finalizeSelection();
});

// =============================
// (4) エピソード選択処理
// =============================
async function openEpisodeSelect() {
  try {
    const res = await fetch(`/api/works/${selectedWorkId}/episodes`);
    if (!res.ok) throw new Error('エピソード取得に失敗');
    const eps = await res.json();
    renderEpisodeCards(eps);
    episodeSelectModal.style.display = 'flex';
  } catch (err) {
    alert('エピソードを取得できませんでした');
    console.error(err);
  }
}

function renderEpisodeCards(eps) {
  episodeList.innerHTML = '';
  decideEpisodeBtn.disabled = true;

  if (!eps || eps.length === 0) {
    episodeList.innerHTML = '<p>エピソードがありません</p>';
    return;
  }

  eps.forEach(ep => {
    const card = document.createElement('div');
    card.classList.add('episode-card');
    const epThumb = ep.thumbnailUrl || '/img/no_thumbnail.png';
    card.innerHTML = `
      <img src="${epThumb}" class="episode-thumb" alt="${ep.title}">
      <div class="episode-card-info"><h4>${ep.title}</h4></div>
    `;
    card.addEventListener('click', () => {
      document.querySelectorAll('.episode-card.selected')
              .forEach(el => el.classList.remove('selected'));
      card.classList.add('selected');
      selectedEpisodeId = ep._id;
      selectedEpisodeTitle = ep.title;
      decideEpisodeBtn.disabled = false;
    });
    episodeList.appendChild(card);
  });
}

decideEpisodeBtn.addEventListener('click', () => {
  
  episodeSelectModal.style.display = 'none';
  finalizeSelection();
});

// =============================
// (5) 選択完了処理
// =============================
function finalizeSelection() {
  // 検索フォームを非表示
  workSelectionBlock.style.display = 'none';

  // 選択された作品とエピソードを表示
  let msg = `作品「${selectedWorkTitleText}」`;
  if (selectedEpisodeTitle) {
    msg += `のエピソード「${selectedEpisodeTitle}」`;
  } else {
    msg += `（エピソード未選択）`;
  }
  msg += 'が選択されています。';

  selectedStatusText.textContent = msg; // 選択内容を表示
  selectedContainer.style.display = 'block'; // 選択完了UIを表示

  // hidden inputに値をセット
  const hiddenWorkTitle = document.getElementById('hiddenWorkTitle');
  const hiddenEpisodeTitle = document.getElementById('hiddenEpisodeTitle');
  if (hiddenWorkTitle) hiddenWorkTitle.value = selectedWorkTitleText;
  if (hiddenEpisodeTitle) hiddenEpisodeTitle.value = selectedEpisodeTitle;
}

// 「選択し直す」ボタンのイベントリスナー
rechooseBtn.addEventListener('click', () => {
  
  // 選択状態をリセット
  selectedWorkId = null;
  selectedWorkTitleText = '';
  selectedEpisodeId = null;
  selectedEpisodeTitle = '';

  // 選択完了UIを非表示
  selectedContainer.style.display = 'none';

  // 検索フォームを再表示
  workSelectionBlock.style.display = 'block';

  // 作品一覧をクリア
  workList.innerHTML = '';
  confirmWorkBtn.disabled = true;
});