// ------- HTML要素の取得 -------
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');
const cancelBtn = document.getElementById('cancelBtn');
const fileInfo = document.getElementById('fileInfo');
const uploadStatus = document.getElementById('uploadStatus');
const uploadResult = document.getElementById('uploadResult');
const uploadProgress = document.getElementById('uploadProgress');
const uploadSection = document.getElementById('uploadSection');

const formSection = document.getElementById('formSection');
const videoFilename = document.getElementById('videoFilename');
const videoStatus = document.getElementById('videoStatus');
const videoSize = document.getElementById('videoSize');

// プレビュー用
const previewVideo = document.getElementById('previewVideo');
const previewTitle = document.getElementById('previewTitle');
const previewDesc = document.getElementById('previewDesc');
const previewTags = document.getElementById('previewTags');

const titleInput = document.getElementById('titleInput');
const descInput = document.getElementById('descInput');
const tagsInput = document.getElementById('tagsInput');
const nextBtn = document.getElementById('nextBtn');

// ← 追加
let selectedFile = null;
let currentVideoId = null;  // 新たに動画IDを保持するため

// ---------- ファイル選択/ドラッグ&ドロップ ----------
selectBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    selectedFile = fileInput.files[0];
    fileInfo.textContent = `選択中: ${selectedFile.name}`;
    startUpload(selectedFile);
  }
});

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    selectedFile = e.dataTransfer.files[0];
    fileInfo.textContent = `ドロップされた: ${selectedFile.name}`;
    startUpload(selectedFile);
  }
});

// (B) 選択解除
cancelBtn?.addEventListener('click', () => {
  selectedFile = null;
  fileInput.value = '';
  fileInfo.textContent = '';
  uploadResult.style.display = 'none';
  uploadProgress.value = 0;
  uploadStatus.style.display = 'none';

  // 「動画を選択」ボタンを再表示する例
  selectBtn.style.display = 'inline-block';

  // 動画IDもクリア
  currentVideoId = null;
});

// --------- アップロード開始 (XMLHttpRequest) ---------
function startUpload(file) {
  if (!file) {
    alert('ファイルが選択されていません');
    return;
  }

  selectBtn.style.display = 'none'; // 選択ボタン消す

  // 進捗バー初期化
  uploadStatus.style.display = 'block';
  uploadProgress.value = 0;
  uploadResult.style.display = 'none';

  const fd = new FormData();
  fd.append('video', file);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/upload', true);

  xhr.upload.onprogress = e => {
    if (e.lengthComputable) {
      const percent = (e.loaded / e.total) * 100;
      uploadProgress.value = percent;
    }
  };

  xhr.onload = () => {
    uploadStatus.style.display = 'none';
    if (xhr.status === 200) {
      const data = JSON.parse(xhr.responseText);
      uploadResult.style.display = 'block';
      uploadResult.textContent = `アップロード成功: ${data.url || ''}`;

      // (★) ここで動画IDを確保
      currentVideoId = data.videoId;

      showFormSection(data.url);
    } else {
      uploadResult.style.display = 'block';
      uploadResult.textContent = `アップロード失敗: ${xhr.statusText}`;
    }
  };

  xhr.onerror = () => {
    uploadStatus.style.display = 'none';
    uploadResult.style.display = 'block';
    uploadResult.textContent = '通信エラーが発生しました';
  };

  xhr.send(fd);
}

// ---------- フォーム画面を表示 ----------
function showFormSection(uploadedUrl) {
  uploadSection.style.display = 'none';
  formSection.style.display = 'block';

  if (selectedFile) {
    videoFilename.textContent = selectedFile.name;
    videoSize.textContent = `${(selectedFile.size / 1024).toFixed(2)}KB`;
    videoStatus.textContent = 'アップロード完了';
  }

  if (uploadedUrl) {
    previewVideo.src = uploadedUrl;
  } else {
    previewVideo.src = '/path/to/default.mp4';
  }
}

// リアルタイム反映
titleInput.addEventListener('input', () => {
  previewTitle.textContent = titleInput.value;
});
descInput.addEventListener('input', () => {
  previewDesc.textContent = descInput.value;
});
tagsInput.addEventListener('input', () => {
  const lines = tagsInput.value.split('\n');
  previewTags.innerHTML = lines.join('<br>');
});



// 投稿するボタン(→ PATCHでDB更新)
nextBtn.addEventListener('click', async () => {
    if (!currentVideoId) {
      alert('動画IDがありません');
      return;
    }
  
    const titleVal = titleInput.value.trim();
    const descVal = descInput.value.trim();
    const tagsVal = tagsInput.value.trim();
  
    try {
      const res = await fetch(`/api/video/${currentVideoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleVal,
          description: descVal,
          tags: tagsVal
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('DB保存完了！');
        // 投稿完了後、一覧画面へ移動
        window.location.href = '/contents';
      } else {
        alert('保存失敗: ' + data.message);
      }
    } catch (err) {
      console.error(err);
      alert('通信エラーが発生しました');
    }
  });