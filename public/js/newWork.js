/* newWork.js – 数字入力＋リアルタイム反映の修正版 */

// === フォーム要素の取得 ===
const thumbnailInput   = document.getElementById('thumbnail');
const titleInput       = document.getElementById('title');
const ratingSelect     = document.getElementById('rating');
const releaseDateInput = document.getElementById('releaseDate'); // 公開年
const synopsisInput    = document.getElementById('synopsis');
const castInput        = document.getElementById('cast');
const studioInput      = document.getElementById('studio');
const categorySelect   = document.getElementById('category');

// === プレビュー要素の取得 ===
const previewImage   = document.getElementById('previewImage');
const playOverlay    = document.getElementById('playOverlay');
const previewTitle   = document.getElementById('previewTitle');
const previewDesc    = document.getElementById('previewDescription');
const previewRating  = document.getElementById('previewRating');
const previewYear    = document.getElementById('previewYear');
const previewExtra   = document.getElementById('previewExtra');
const previewCast    = document.getElementById('previewCast');
const previewStudio  = document.getElementById('previewStudio');
const toggleExtraBtn = document.getElementById('toggleExtra');
const placeholderOverlay= document.getElementById('placeholderOverlay');

const previewThumbnailWrapper = document.querySelector('.preview-thumbnail-wrapper');
previewThumbnailWrapper.addEventListener('click', () => {
  thumbnailInput.click();
});

previewImage.addEventListener('click', () => {
    // 既存の input[type="file"] をプログラム的にクリック
    thumbnailInput.click();
  });
// ---------------------------------------------
// 1. サムネイル画像プレビュー
// ---------------------------------------------
thumbnailInput.addEventListener('change', () => {
    const file = thumbnailInput.files[0];
    if (!file) {
      // ファイルが未選択 → オーバーレイを表示し、デフォルト画像に戻す
      previewImage.src = ''; 
      previewImage.classList.add('hidden');
      previewThumbnailWrapper.classList.add('empty-thumb');
      return;
    }
    // ファイルあり → FileReaderでプレビュー & オーバーレイ非表示
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
// 3. あらすじ → リアルタイム反映
// ---------------------------------------------
synopsisInput.addEventListener('input', () => {
  previewDesc.textContent = synopsisInput.value.trim() || '説明文はここに表示されます。';
});

// ---------------------------------------------
// 4. レーティング → リアルタイム反映
// ---------------------------------------------
ratingSelect.addEventListener('change', () => {
    const val = ratingSelect.value;   // ex: "PG-12"
  
    // ratingの値から「数字+」等へ変換する例
    let ratingText = '';
    switch (val) {
      case 'G':
        ratingText = 'ALL';   // 例: Gは「ALL」
        break;
      case 'PG-12':
        ratingText = '12+';   // 例: PG-12は「12+」
        break;
      case 'R15+':
        ratingText = '15+';
        break;
      case 'R18+':
        ratingText = '18+';
        break;
      default:
        ratingText = ''; // 未選択や想定外なら空
        break;
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
// 5. 公開年 (数字のみ + リアルタイム反映)
// ---------------------------------------------
releaseDateInput.addEventListener('keydown', e => {
  // IME入力中など、キーコード229になる場合をスキップ
  // (日本語変換中にすべて弾いてしまうのを回避)
  if (e.isComposing || e.keyCode === 229) {
    return; 
  }

  // 許可する特殊キー (バックスペース,Delete,矢印,Tab など)
  const allowedKeys = [
    'Backspace', 'Delete',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Tab'
  ];
  if (allowedKeys.includes(e.key)) {
    // これらのキーは通す
    return;
  }

  // 通常の文字キーの場合 → '0'～'9' 以外はブロック
  if (e.key.length === 1 && (e.key < '0' || e.key > '9')) {
    e.preventDefault();
  }
});

// コピペや全角数字対策 → 入力後に数字以外を削除しつつプレビューへ反映
releaseDateInput.addEventListener('input', () => {
  releaseDateInput.value = releaseDateInput.value.replace(/[^0-9]/g, '');

  // リアルタイムでプレビュー反映
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
  if (categorySelect.value === 'singleVideo') {
    playOverlay.style.display = 'block';
  } else {
    playOverlay.style.display = 'none';
  }
});

// ---------------------------------------------
// 8. 「詳細」ボタンでキャスト/制作をトグル表示
// ---------------------------------------------
toggleExtraBtn.addEventListener('click', () => {
  previewExtra.classList.toggle('hidden');
});

// ---------------------------------------------
// 9. ページ初期表示時に一度反映させる
// ---------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  thumbnailInput.dispatchEvent(new Event('change'));
  titleInput.dispatchEvent(new Event('input'));
  synopsisInput.dispatchEvent(new Event('input'));
  ratingSelect.dispatchEvent(new Event('change'));
  releaseDateInput.dispatchEvent(new Event('input'));
  castInput.dispatchEvent(new Event('input'));
  studioInput.dispatchEvent(new Event('input'));
  categorySelect.dispatchEvent(new Event('change'));
});
