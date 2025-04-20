// scriptVideo.js

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');
const fileInfo = document.getElementById('fileInfo');
const uploadStatus = document.getElementById('uploadStatus');
const uploadResult = document.getElementById('uploadResult');
const uploadProgress = document.getElementById('uploadProgress');
const uploadSection = document.getElementById('uploadSection');

const formSection = document.getElementById('formSection');
const videoFilename = document.getElementById('videoFilename');
const videoStatus = document.getElementById('videoStatus');
const videoSize = document.getElementById('videoSize');

const previewVideo = document.getElementById('previewVideo');
const previewTitle = document.getElementById('previewTitle');
const previewDesc = document.getElementById('previewDesc');
const previewTags = document.getElementById('previewTags');

const titleInput = document.getElementById('titleInput');
const descInput = document.getElementById('descInput');
const tagsInput = document.getElementById('tagsInput');
const nextBtn = document.getElementById('nextBtn');

let selectedFile = null;
let uploadedUrl = null;

// ドラッグ&ドロップ
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
    fileInfo.textContent = `ドロップ: ${selectedFile.name}`;
    startUpload(selectedFile);
  }
});

// ファイル選択
selectBtn.addEventListener('click', () => {
  fileInput.click();
});
fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    selectedFile = fileInput.files[0];
    fileInfo.textContent = `選択: ${selectedFile.name}`;
    startUpload(selectedFile);
  }
});

function startUpload(file) {
  if (!file) return;
  uploadStatus.style.display = 'block';
  uploadProgress.value = 0;
  uploadResult.style.display = 'none';
  selectBtn.style.display = 'none';

  const formData = new FormData();
  formData.append('video', file);

  // 変更: '/api/uploadVideo' に一致させる
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/uploadVideo', true);

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
      if (data.success) {
        uploadResult.textContent = `アップロード成功: ${data.url}`;
        uploadedUrl = data.url;
        showFormSection(file, uploadedUrl);
      } else {
        uploadResult.textContent = `アップロード失敗: ${data.message}`;
      }
    } else {
      uploadResult.style.display = 'block';
      uploadResult.textContent = 'アップロードに失敗しました';
    }
  };

  xhr.onerror = () => {
    uploadStatus.style.display = 'none';
    uploadResult.style.display = 'block';
    uploadResult.textContent = '通信エラーが発生しました';
  };

  xhr.send(formData);
}

function showFormSection(file, url) {
  uploadSection.style.display = 'none';
  formSection.style.display = 'block';

  videoFilename.textContent = file.name;
  videoSize.textContent = (file.size / 1048576).toFixed(2) + ' MB';
  videoStatus.textContent = 'アップロード完了';

  if (url) {
    previewVideo.src = url;
  }
}

// フォームのリアルタイム反映
titleInput.addEventListener('input', () => {
  previewTitle.textContent = titleInput.value;
});
descInput.addEventListener('input', () => {
  previewDesc.textContent = descInput.value;
});
tagsInput.addEventListener('input', () => {
  previewTags.textContent = tagsInput.value;
});

// 投稿ボタン
nextBtn.addEventListener('click', async () => {
  const payload = {
    title: titleInput.value.trim(),
    desc: descInput.value.trim(),
    tags: tagsInput.value.trim(),
    videoUrl: uploadedUrl
  };

  // 修正: ちゃんと対応するルート '/api/createVideoPost' を用意
  try {
    const res = await fetch('/api/createVideoPost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      alert('投稿完了');
      // 一覧 or 他のページへ
      window.location.href = '/contents';
    } else {
      alert('投稿失敗: ' + data.message);
    }
  } catch (err) {
    console.error(err);
    alert('通信エラーが発生しました');
  }
});
