/* uplodeEpisode.js */
// 秒数をhh:mm:ss形式に変換
function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map(v => String(v).padStart(2, '0'))
    .join(':');
}

document.addEventListener('DOMContentLoaded', () => {
    /* --------------------------------------------------
     * A) 動画ファイル → サムネイル画像
     * -------------------------------------------------- */
    const drop         = document.getElementById('mainDrop');
    const input        = document.getElementById('contentFile');
    const details      = document.getElementById('details');
    const previewArea  = document.getElementById('previewArea');
  
    // ドラッグ＆ドロップ
    ['dragenter','dragover'].forEach(evt => {
      drop.addEventListener(evt, e => {
        e.preventDefault();
        drop.classList.add('dragover');
      });
    });
    ['dragleave','drop'].forEach(evt => {
      drop.addEventListener(evt, e => {
        e.preventDefault();
        drop.classList.remove('dragover');
      });
    });
    drop.addEventListener('drop', e => {
      const file = e.dataTransfer.files[0];
      if (file) handleVideoFile(file);
    });
    drop.addEventListener('click', () => input.click());
    input.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) handleVideoFile(file);
    });
  
    function handleVideoFile(file) {
      generateThumbnail(file)
        .then(thumbnailUrl => {
          previewArea.innerHTML = '';
          const img = document.createElement('img');
          img.src = thumbnailUrl;
          previewArea.appendChild(img);
  
          // 選択後にフォーム表示
          drop.classList.add('hidden');
          details.classList.remove('hidden');
        })
        .catch(err => {
          console.error('サムネイル生成エラー: ', err);
          alert('プレビュー用画像が生成できませんでした。');
        });
    }
  
    function generateThumbnail(file) {
      return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        video.src = URL.createObjectURL(file);
  
        video.addEventListener('loadedmetadata', () => {
          video.currentTime = 0; // 先頭フレーム
        });
    
        video.addEventListener('loadedmetadata', () => {
      // 1) 合計秒数を取得
      const totalSeconds = Math.floor(video.duration);
      // 2) 分単位に変換してセット（バックエンド保存仕様に合わせる）
      const minutes = Math.round(totalSeconds / 60);
      const durIn = document.getElementById('duration');
      durIn.value = minutes;
    });
          // 5) 既存の input イベントを発火させる（他ロジック用）
          if (durIn) durIn.dispatchEvent(new Event('input'));
          // 先頭フレームに移動 (サムネイル生成用)
          video.currentTime = 0;
        });
    
        video.addEventListener('seeked', () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL('image/jpeg', 0.7);
            resolve(dataURL);
          } catch (e) {
            reject(e);
          }
        });
        video.onerror = err => reject(err);
      });
    }

    /* --------------------------------------------------
     * B) タイトル + あらすじ → 2行まで表示 & 続きを見るトグル
     * -------------------------------------------------- */
    const titleIn      = document.getElementById('title');
    const descIn       = document.getElementById('description');
    const episodeInfoLine = document.getElementById('episodeInfoLine'); // 2行までに制限
    const combinedTextEl  = document.getElementById('combinedText');    // [タイトル + スペース + あらすじ]
    const toggleMoreEl    = document.getElementById('toggleMore');
  
    let fullText = '';
    let isExpanded = false;
  
    function updateCombinedText() {
      const titleVal = titleIn.value.trim() || 'エピソードタイトル：';
      const descVal  = descIn.value.trim() || 'あらすじ';
      fullText = `${titleVal} ${descVal}`;
  
      if (!isExpanded) {
        // 閉じている状態 → 2行制限
        episodeInfoLine.classList.add('clamp-2');
      } else {
        // 展開中 → 全文表示
        episodeInfoLine.classList.remove('clamp-2');
      }
      combinedTextEl.textContent = fullText;
  
      requestAnimationFrame(checkOverflow);
    }
    function checkOverflow() {
      if (episodeInfoLine.scrollHeight > episodeInfoLine.clientHeight + 1) {
        // 溢れている → 「続きを見る」表示
        if (!isExpanded) {
          toggleMoreEl.classList.remove('hidden');
        }
      } else {
        // 溢れてない → リンクを隠す
        toggleMoreEl.classList.add('hidden');
      }
    }
    toggleMoreEl.addEventListener('click', () => {
      isExpanded = !isExpanded;
      updateCombinedText();
      toggleMoreEl.textContent = isExpanded ? '---閉じる---' : '---続きを見る---';
    });
    titleIn.addEventListener('input', updateCombinedText);
    descIn.addEventListener('input', updateCombinedText);
  
    /* --------------------------------------------------
     * C) 時間 / 価格 → リアルタイム反映
     * -------------------------------------------------- */
    const durIn        = document.getElementById('duration');
    const priceIn      = document.getElementById('price');
    const previewDuration = document.getElementById('previewDuration');
    const previewPrice    = document.getElementById('previewPrice');
  
    durIn.addEventListener('input', () => {
      const val = durIn.value;
      previewDuration.textContent = val || '00:00:00';
    });
    priceIn.addEventListener('input', () => {
      const val = priceIn.value.trim();
      previewPrice.textContent = (!val || val === '0') ? '無料' : `${val}円`;
    });
  
    /* --------------------------------------------------
     * D) 「詳細」ボタンでレーティング等をトグル表示 (from newWork.js)
     * -------------------------------------------------- */
    const toggleExtraBtn = document.getElementById('toggleExtra');
    const previewExtra   = document.getElementById('previewExtra');
  
    // 作品詳細(レーティング, 公開年, cast, studio)をリアルタイム反映したいなら
    // フォーム要素も取得し、input/changeイベントで反映してください。
    // (例: const ratingSelect = document.getElementById('rating'); ...)
  
    toggleExtraBtn.addEventListener('click', () => {
      previewExtra.classList.toggle('hidden');
    });
  
    // ▼ もしレーティングをリアルタイムに反映するなら
    // const ratingSelect = document.getElementById('rating');
    // const previewRating= document.getElementById('previewRating');
    // ratingSelect.addEventListener('change', () => {
    //   const val = ratingSelect.value;
    //   if (!val) {
    //     previewRating.classList.add('hidden');
    //   } else {
    //     previewRating.textContent = val;
    //     previewRating.classList.remove('hidden');
    //   }
    // });
  
    /* --------------------------------------------------
     * ページロード時に初期化
     * -------------------------------------------------- */
    function init() {
      updateCombinedText();
      durIn.dispatchEvent(new Event('input'));
      priceIn.dispatchEvent(new Event('input'));
    }
    init();
});