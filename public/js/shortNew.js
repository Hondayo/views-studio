// 要素取得
const uploadSection   = document.getElementById('uploadSection');
const fileInput       = document.getElementById('fileInput');
const selectBtn       = document.getElementById('selectBtn');

const progressArea    = document.getElementById('progressArea');
const uploadedInfo    = document.getElementById('uploadedInfo');
const progressBar     = document.getElementById('progressBar');

const postContainer   = document.getElementById('postContainer');
const descriptionInput= document.getElementById('descriptionInput');
const previewText     = document.getElementById('previewText');
const replaceBtn      = document.getElementById('replaceBtn');
const submitBtn       = document.getElementById('submitBtn');

const replaceBtnInProgress = document.getElementById('replaceBtnInProgress');
const previewVideo= document.getElementById('previewVideo');

let uploadedFile = null;

// ===== ドラッグ＆ドロップ =====
uploadSection.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadSection.classList.add('dragover');
});
uploadSection.addEventListener('dragleave', () => {
  uploadSection.classList.remove('dragover');
});
uploadSection.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadSection.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files.length) {
    handleFileSelected(e.dataTransfer.files[0]);
  }
});

// ===== ファイル選択ボタン =====
selectBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files.length) {
    handleFileSelected(e.target.files[0]);
  }
});




// 差し替えボタン
replaceBtnInProgress.addEventListener('click', () => {
  // 1) フォームを非表示
  postContainer.style.display = 'none';

  // 2) 進捗エリアを非表示 & リセット
  progressArea.style.display = 'none';
  progressBar.style.width = '0%';
  uploadedInfo.textContent = '';

  // 3) ドラッグ&ドロップフォーム再表示
  uploadSection.style.display = 'block';
  fileInput.value = ''; // 選択をクリア
  uploadedFile = null;

  // 説明やプレビューもクリアしたければ
  descriptionInput.value = '';
  previewText.textContent = '';
});

// 説明 → プレビュー
descriptionInput.addEventListener('input', () => {
  previewText.textContent = descriptionInput.value;
});

function handleFileSelected(file) {
    uploadedFile = file;
  
    // ドラッグ&ドロップフォームを隠して、進捗バーを表示
    uploadSection.style.display = 'none';
    progressArea.style.display  = 'block';
    postContainer.style.display = 'flex'; // フォーム＆プレビューを表示
  
    const sizeMB = (file.size / (1024*1024)).toFixed(2);
    uploadedInfo.textContent = `${file.name} (${sizeMB}MB) - アップロード中...`;
  
    // 疑似進捗バー
    progressBar.style.width = '0%';
    let loaded = 0;
    const total = file.size;
    let interval = setInterval(() => {
      loaded += total / 50;
      const percent = Math.min((loaded / total) * 100, 100);
      progressBar.style.width = percent + '%';
      if (percent >= 100) {
        clearInterval(interval);
        uploadedInfo.textContent = `${file.name} (${sizeMB}MB) - アップロード完了`;
      }
    }, 100);
  
    // ▼ (重要) 動画のプレビュー設定
    const videoURL = URL.createObjectURL(file);
    previewVideo.src = videoURL;
  
    previewVideo.addEventListener('loadedmetadata', () => {
      const vw = previewVideo.videoWidth;
      const vh = previewVideo.videoHeight;
      if (!vw || !vh) return;
  
      const aspect = vw / vh; 
      const wrapperW = 390;  
      const wrapperH = 844;  
  
      if (aspect < 1) {
        // 縦長 → 枠全体を埋める
        previewVideo.style.width  = `${wrapperW}px`;
        previewVideo.style.height = `${wrapperH}px`;
      } else {
        // 横長 → 幅に合わせて高さ自動
        previewVideo.style.width  = `${wrapperW}px`;
        previewVideo.style.height = 'auto';
      }
    });
  
    // ホバーで再生/停止
    previewVideo.addEventListener('mouseenter', () => {
      previewVideo.currentTime = 0;
      previewVideo.play();
    });
    previewVideo.addEventListener('mouseleave', () => {
      previewVideo.pause();
      previewVideo.currentTime = 0;
    });
  }
  

// 投稿
submitBtn.addEventListener('click', () => {
  alert('投稿しました！（デモ）');
});


