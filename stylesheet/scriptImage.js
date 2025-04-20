// public/scriptImage.js

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

const previewVideo = document.getElementById('previewVideo'); // 画像用だがIDは使い回し
const previewTitle = document.getElementById('previewTitle');
const previewDesc = document.getElementById('previewDesc');
const previewTags = document.getElementById('previewTags');

const titleInput = document.getElementById('titleInput');
const descInput = document.getElementById('descInput');
const tagsInput = document.getElementById('tagsInput');
const nextBtn = document.getElementById('nextBtn');

let selectedFiles = [];
let uploadedUrls = [];

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
    selectedFiles = Array.from(e.dataTransfer.files);
    const names = selectedFiles.map(f => f.name).join(', ');
    fileInfo.textContent = `ドロップ: ${names}`;
    startUpload(selectedFiles);
  }
});

// 選択ボタン
selectBtn.addEventListener('click', () => {
  fileInput.click();
});
fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    selectedFiles = Array.from(fileInput.files);
    const names = selectedFiles.map(f => f.name).join(', ');
    fileInfo.textContent = `選択: ${names}`;
    startUpload(selectedFiles);
  }
});

function startUpload(files) {
  if (!files || files.length === 0) return;
  uploadStatus.style.display = 'block';
  uploadProgress.value = 0;
  uploadResult.style.display = 'none';
  selectBtn.style.display = 'none';

  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });

  // 画像アップロード
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/uploadImage', true);

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
        uploadResult.textContent = `アップロード成功: ${data.urls?.length || 0} 個`;
        uploadedUrls = data.urls || [];
        showFormSection(files, uploadedUrls);
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

function showFormSection(files, urls) {
  uploadSection.style.display = 'none';
  formSection.style.display = 'block';

  const names = files.map(f => f.name).join(', ');
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const mb = (totalSize / 1048576).toFixed(2);

  videoFilename.textContent = names;
  videoSize.textContent = mb + ' MB(合計)';
  videoStatus.textContent = 'アップロード完了';

  if (urls && urls[0]) {
    previewVideo.src = urls[0]; // 1枚目を <video>タグに表示(やむを得ず)
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
  previewTags.textContent = tagsInput.value;
});

// 投稿ボタン
nextBtn.addEventListener('click', async () => {
  const payload = {
    title: titleInput.value,
    desc: descInput.value,
    tags: tagsInput.value,
    images: uploadedUrls
  };
  try {
    const res = await fetch('/api/createImagePost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      alert('投稿完了');
      window.location.href = '/contents'; // or /myContent
    } else {
      alert('投稿失敗: ' + data.message);
    }
  } catch (err) {
    console.error(err);
    alert('通信エラーが発生しました');
  }
});
