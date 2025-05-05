// public/js/workEdit.js

// 1) DOM要素取得
const thumbnailInput    = document.getElementById('thumbnail');
const thumbnailSelectBtn = document.getElementById('thumbnailSelectBtn');
const thumbnailFileName = document.getElementById('thumbnailFileName');

const thumbnailVideoInput   = document.getElementById('thumbnailVideo');
const thumbnailVideoSelectBtn = document.getElementById('thumbnailVideoSelectBtn');
const thumbnailVideoFileName  = document.getElementById('thumbnailVideoFileName');

const titleInput       = document.getElementById('title');
const ratingSelect     = document.getElementById('rating');
const releaseDateInput = document.getElementById('releaseDate');
const castInput        = document.getElementById('cast');
const studioInput      = document.getElementById('studio');
const tagsInput        = document.getElementById('tags');

// プレビュー関連
const previewImage   = document.getElementById('previewImage');
const previewVideo   = document.getElementById('previewVideo');
const placeholderOverlay = document.getElementById('placeholderOverlay');

const previewTitle   = document.getElementById('previewTitle');
const previewYear    = document.getElementById('previewYear');
const previewRating  = document.getElementById('previewRating');
const previewCast    = document.getElementById('previewCast');
const previewStudio  = document.getElementById('previewStudio');

const previewExtra   = document.getElementById('previewExtra');
const toggleExtraBtn = document.getElementById('toggleExtra');
const previewWrapper = document.getElementById('previewWrapper');

// フォームやボタン
const editWorkForm  = document.getElementById('editWorkForm');
const saveButton    = document.getElementById('saveButton');
const loadingOverlay= document.getElementById('loadingOverlay');

// 2) ファイル選択ボタンの制御
thumbnailSelectBtn.addEventListener('click', () => {
  thumbnailInput.click();
});
thumbnailVideoSelectBtn.addEventListener('click', () => {
  thumbnailVideoInput.click();
});

// 3) サムネ画像プレビュー
thumbnailInput.addEventListener('change', () => {
  if (!thumbnailInput.files || thumbnailInput.files.length === 0) return;
  const file = thumbnailInput.files[0];
  thumbnailFileName.textContent = `選択中: ${file.name}`;

  const reader = new FileReader();
  reader.onload = e => {
    previewImage.src = e.target.result;
  };
  reader.readAsDataURL(file);

  // 表示切り替え
  previewImage.classList.remove('hidden');
  placeholderOverlay.classList.add('hidden');
});

// 4) サムネ動画プレビュー
thumbnailVideoInput.addEventListener('change', () => {
  if (!thumbnailVideoInput.files || thumbnailVideoInput.files.length === 0) return;
  const file = thumbnailVideoInput.files[0];
  thumbnailVideoFileName.textContent = `選択中: ${file.name}`;

  const reader = new FileReader();
  reader.onload = e => {
    previewVideo.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

// マウスホバーで画像→動画再生
previewWrapper.addEventListener('mouseenter', () => {
  if (previewVideo.src) {
    previewImage.classList.add('hidden');
    previewVideo.classList.remove('hidden');
    previewVideo.currentTime = 0;
    previewVideo.play();
  }
});
previewWrapper.addEventListener('mouseleave', () => {
  previewVideo.pause();
  previewVideo.classList.add('hidden');
  previewImage.classList.remove('hidden');
});

// 5) テキスト項目(タイトル/レーティング/公開年/キャスト/スタジオ) リアルタイム反映
titleInput.addEventListener('input', () => {
  const val = titleInput.value.trim() || '作品タイトル';
  previewTitle.textContent = val;
});

ratingSelect.addEventListener('change', () => {
  const val = ratingSelect.value;
  if (val) {
    previewRating.textContent = val;
    previewRating.classList.remove('hidden');
  } else {
    previewRating.textContent = '';
    previewRating.classList.add('hidden');
  }
});

releaseDateInput.addEventListener('input', () => {
  const val = releaseDateInput.value.replace(/[^0-9]/g, '');
  releaseDateInput.value = val; // 数字以外削除
  if (val) {
    previewYear.textContent = val;
    previewYear.classList.remove('hidden');
  } else {
    previewYear.textContent = '';
    previewYear.classList.add('hidden');
  }
});

function updateCastStudio() {
  previewCast.textContent  = castInput.value.trim()   || '-';
  previewStudio.textContent= studioInput.value.trim() || '-';
}
castInput.addEventListener('input', updateCastStudio);
studioInput.addEventListener('input', updateCastStudio);

// 6) 「詳細」トグル
toggleExtraBtn.addEventListener('click', () => {
  previewExtra.classList.toggle('hidden');
});

// 7) フォーム送信時：多重クリック防止
editWorkForm.addEventListener('submit', (e) => {
  if (saveButton.disabled) return; // 2回目以降は無視

  saveButton.disabled = true;
  loadingOverlay.classList.remove('hidden');
  // フォームはそのまま送信
});

// 8) ページ読込時、初期反映
window.addEventListener('DOMContentLoaded', () => {
  // 下記のイベントを明示的に呼び出す
  thumbnailInput.dispatchEvent(new Event('change'));
  thumbnailVideoInput.dispatchEvent(new Event('change'));
  titleInput.dispatchEvent(new Event('input'));
  ratingSelect.dispatchEvent(new Event('change'));
  releaseDateInput.dispatchEvent(new Event('input'));
  castInput.dispatchEvent(new Event('input'));
  studioInput.dispatchEvent(new Event('input'));
});
