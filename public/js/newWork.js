// newWork.js

// === フォーム要素の取得 ===
const thumbnailInput   = document.getElementById('thumbnail');
const titleInput       = document.getElementById('title');
const ratingSelect     = document.getElementById('rating');
const releaseDateInput = document.getElementById('releaseDate');
// const synopsisInput    = document.getElementById('synopsis'); // ← 削除
const castInput        = document.getElementById('cast');
const studioInput      = document.getElementById('studio');
const categorySelect   = document.getElementById('category');

// === プレビュー要素の取得 ===
const previewImage    = document.getElementById('previewImage');
const playOverlay     = document.getElementById('playOverlay');
const previewTitle    = document.getElementById('previewTitle');
const previewRating   = document.getElementById('previewRating');
const previewYear     = document.getElementById('previewYear');
const previewExtra    = document.getElementById('previewExtra');
const previewCast     = document.getElementById('previewCast');
const previewStudio   = document.getElementById('previewStudio');
const toggleExtraBtn  = document.getElementById('toggleExtra');
const placeholderOverlay = document.getElementById('placeholderOverlay');

// ---------------------------------------------
// 1. サムネイル画像プレビュー
// ---------------------------------------------
const previewThumbnailWrapper = document.querySelector('.preview-thumbnail-wrapper');
previewThumbnailWrapper.addEventListener('click', () => {
  thumbnailInput.click();
});
previewImage.addEventListener('click', () => {
  thumbnailInput.click();
});

thumbnailInput.addEventListener('change', () => {
  const file = thumbnailInput.files[0];
  if (!file) {
    previewImage.src = '';
    previewImage.classList.add('hidden');
    previewThumbnailWrapper.classList.add('empty-thumb');
    placeholderOverlay.classList.remove('hidden');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    previewImage.src = e.target.result;
  };
  reader.readAsDataURL(file);

  previewImage.classList.remove('hidden');
  placeholderOverlay.classList.add('hidden');
  previewThumbnailWrapper.classList.remove('empty-thumb');
});

// ---------------------------------------------
// 2. タイトル → リアルタイム反映
// ---------------------------------------------
titleInput.addEventListener('input', () => {
  previewTitle.textContent = titleInput.value.trim() || '作品タイトル';
});

// ---------------------------------------------
// 3. あらすじ系は不要なので削除
// ---------------------------------------------

// ---------------------------------------------
// 4. レーティング → リアルタイム反映
// ---------------------------------------------
ratingSelect.addEventListener('change', () => {
  const val = ratingSelect.value;
  let ratingText = '';
  switch (val) {
    case 'G':      ratingText = 'ALL';  break;
    case 'PG-12':  ratingText = '12+';  break;
    case 'R15+':   ratingText = '15+';  break;
    case 'R18+':   ratingText = '18+';  break;
    default:       ratingText = '';     break;
  }
  if (ratingText) {
    previewRating.textContent = ratingText;
    previewRating.classList.remove('hidden');
  } else {
    previewRating.textContent = '';
    previewRating.classList.add('hidden');
  }
});

// ---------------------------------------------
// 5. 公開年 → 数字のみ & リアルタイム反映
// ---------------------------------------------
releaseDateInput.addEventListener('keydown', e => {
  if (e.isComposing || e.keyCode === 229) return;
  const allowedKeys = ['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab'];
  if (allowedKeys.includes(e.key)) return;
  if (e.key.length === 1 && (e.key < '0' || e.key > '9')) {
    e.preventDefault();
  }
});
releaseDateInput.addEventListener('input', () => {
  releaseDateInput.value = releaseDateInput.value.replace(/[^0-9]/g, '');
  const val = releaseDateInput.value.trim();
  if (val) {
    previewYear.textContent = val;
    previewYear.classList.remove('hidden');
  } else {
    previewYear.textContent = '';
    previewYear.classList.add('hidden');
  }
});

// ---------------------------------------------
// 6. キャスト / スタジオ → リアルタイム反映
// ---------------------------------------------
function updateCastStudio() {
  const c = castInput.value.trim();
  const s = studioInput.value.trim();
  previewCast.textContent  = c || '-';
  previewStudio.textContent = s || '-';
}
castInput.addEventListener('input', updateCastStudio);
studioInput.addEventListener('input', updateCastStudio);

// ---------------------------------------------
// 7. カテゴリー (単発なら再生アイコン表示)
// ---------------------------------------------
categorySelect.addEventListener('change', () => {
  playOverlay.style.display = (categorySelect.value === 'singleVideo') ? 'block' : 'none';
});

// ---------------------------------------------
// 8. 「詳細」ボタンでキャスト/制作をトグル表示
// ---------------------------------------------
toggleExtraBtn.addEventListener('click', () => {
  previewExtra.classList.toggle('hidden');
});

// ---------------------------------------------
// 9. ページ初期表示時に一度反映させる
//    synopsisInputイベントは削除
// ---------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  thumbnailInput.dispatchEvent(new Event('change'));
  titleInput.dispatchEvent(new Event('input'));
  ratingSelect.dispatchEvent(new Event('change'));
  releaseDateInput.dispatchEvent(new Event('input'));
  castInput.dispatchEvent(new Event('input'));
  studioInput.dispatchEvent(new Event('input'));
  categorySelect.dispatchEvent(new Event('change'));
});

// フォーム & ボタン & ローディング要素を取得
const workForm = document.getElementById('workForm');
const publishButton = document.getElementById('publishButton');
const loadingOverlay = document.getElementById('loadingOverlay');

// 「submit」イベントで制御
workForm.addEventListener('submit', (event) => {
  // すでに disabled なら何もしない (多重防止)
  if (publishButton.disabled) {
    return;
  }

  // 1. ボタンを無効化
  publishButton.disabled = true;

  // 2. ローディング表示を出す
  loadingOverlay.classList.remove('hidden');

  // 3. フォームをそのまま送信（サーバーへ）
  //    このまま `form` の `action="/works"` にPOSTされる想定
  //    通常通りサーバー処理が実行され、完了後リダイレクトやレスポンスを返す
});
// フォーム & ボタン & ローディング要素を取得

/**
 * 多重クリックを防止するため、フォームの submit イベントを拾う
 */
workForm.addEventListener('submit', (event) => {
  // 既にdisabledなら何もしない (連打防止)
  if (publishButton.disabled) {
    return;
  }
  // ボタン無効化・ローディング表示
  publishButton.disabled = true;
  loadingOverlay.classList.remove('hidden');
  
  // ここでフォームは通常通りsubmitされ、サーバー処理が完了すると次のページへ遷移
  // AJAXの場合は event.preventDefault() して fetch / axios で送信し、
  // 成功時に画面遷移等を行う
});
