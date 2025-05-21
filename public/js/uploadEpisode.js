/* uplodeEpisode.js */
// 秒数をhh:mm:ss形式に変換（1か所に統一）
function formatDuration(seconds) {
  seconds = Math.floor(seconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

document.addEventListener('DOMContentLoaded', () => {
  // --- [追加] プレビュー反映用 ---
  // フォーム要素
  const thumbnailInput = document.getElementById('thumbnailImageInput');
  // プレビュー側サムネイルimgを生成・差し替えする場所
  const previewArea = document.getElementById('previewArea');
  const previewThumbPlaceholder = document.getElementById('previewThumbPlaceholder');
  // テキスト項目
  const titleInput = document.getElementById('title');
  const priceInput = document.getElementById('price');
  const descInput = document.getElementById('description');
  const previewTitleText = document.getElementById('previewTitleText');
  const previewPrice = document.getElementById('previewPrice');
  const previewDescText = document.getElementById('previewDescText');

  // サムネイル画像：フォーム下とスマホプレビュー両方に反映する共通関数
  function updateThumbnailPreviews(imgSrc) {
    // 左フォーム下
    const thumbnailImagePreview = document.getElementById('thumbnailImagePreview');
    if (thumbnailImagePreview) {
      thumbnailImagePreview.src = imgSrc;
      thumbnailImagePreview.style.display = 'block';
    }
    // 右スマホ枠
    if (previewArea) {
      previewArea.innerHTML = '';
      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = 'サムネイルプレビュー';
      img.classList.add('ep-thumb'); // 必ずクラスを付与
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      // CSSでborder-radiusを統一するため、ここでのborderRadius指定は削除
      previewArea.appendChild(img);
    }
  }
  if (thumbnailInput) {
    thumbnailInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        updateThumbnailPreviews(ev.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  // タイトル
  if (titleInput && previewTitleText) {
    const previewTitleLabel = document.querySelector('#previewTitle .preview-label');
    const updateTitlePreview = () => {
      const val = titleInput.value.trim();
      previewTitleText.textContent = val;
      if (previewTitleLabel) {
        previewTitleLabel.style.display = val ? 'none' : '';
      }
    };
    titleInput.addEventListener('input', updateTitlePreview);
    updateTitlePreview();
  }
  // あらすじ
  if (descInput && previewDescText) {
    const previewDescLabel = document.querySelector('#previewDesc .preview-label');
    const updateDescPreview = () => {
      const val = descInput.value.trim();
      previewDescText.textContent = val;
      if (previewDescLabel) {
        previewDescLabel.style.display = val ? 'none' : '';
      }
    };
    descInput.addEventListener('input', updateDescPreview);
    updateDescPreview();
  }
  // 価格
  if (priceInput && previewPrice) {
    priceInput.addEventListener('input', () => {
      const val = priceInput.value.trim();
      previewPrice.textContent = (!val || val === '0') ? '無料' : `${val}円`;
    });
  }

  // サムネイル画像⇔動画の切り替え
  const wrapper = document.getElementById('previewThumbnailWrapper');
  const img = document.getElementById('previewThumbnailImg');
  const video = document.getElementById('previewThumbnailVideo');
  if (wrapper && img && video) {
    wrapper.addEventListener('mouseenter', () => {
      img.style.display = 'none';
      video.style.display = 'block';
      video.currentTime = 0;
      video.play();
    });
    wrapper.addEventListener('mouseleave', () => {
      video.pause();
      video.style.display = 'none';
      img.style.display = 'block';
    });
  }

  // 作品あらすじの「続きを見る」トグル機能
  const workDescription = document.getElementById('workDescription');
  const toggleDescription = document.getElementById('toggleDescription');
  
  if (workDescription && toggleDescription) {
    // テキストの高さをチェックして、2行以上あれば「続きを見る」ボタンを表示
    const checkDescriptionHeight = () => {
      const lineHeight = parseInt(window.getComputedStyle(workDescription).lineHeight);
      const height = workDescription.scrollHeight;
      const lines = height / lineHeight;
      
      if (lines > 2) {
        toggleDescription.classList.remove('hidden');
      } else {
        toggleDescription.classList.add('hidden');
      }
    };
    
    // 「続きを見る」ボタンのクリックイベント
    toggleDescription.addEventListener('click', () => {
      if (workDescription.classList.contains('expanded')) {
        workDescription.classList.remove('expanded');
        toggleDescription.textContent = '---続きを見る---';
      } else {
        workDescription.classList.add('expanded');
        toggleDescription.textContent = '---閉じる---';
      }
    });
    
    // 初期チェック
    checkDescriptionHeight();
    
    // ウィンドウリサイズ時にも再チェック
    window.addEventListener('resize', checkDescriptionHeight);
  }

  // サムネ動画の強制停止
  function forcePauseThumbVideos() {
    document.querySelectorAll('.ep-thumb-video').forEach(video => {
      video.currentTime = 0;
      video.pause();
    });
  }

  // エピソード時間表示を統一
  function setEpisodeDurationSpans() {
    document.querySelectorAll('.ep-duration').forEach(span => {
      let sec = Number(span.dataset.seconds);
      if (!isNaN(sec) && sec > 0) {
        span.textContent = formatDuration(sec);
        return;
      }
      // span内テキストからパース
      const raw = span.textContent.trim();
      if (raw && /^[0-9:]+$/.test(raw)) {
        const parts = raw.split(':').map(Number);
        let totalSec = 0;
        if (parts.length === 3) totalSec = parts[0]*3600 + parts[1]*60 + parts[2];
        else if (parts.length === 2) totalSec = parts[0]*60 + parts[1];
        else if (parts.length === 1) totalSec = parts[0];
        span.textContent = formatDuration(totalSec);
        return;
      }
      // videoタグから取得
      const card = span.closest('.episode-card');
      if (card) {
        const video = card.querySelector('video');
        if (video) {
          if (!isNaN(video.duration) && video.duration > 0) {
            span.textContent = formatDuration(Math.floor(video.duration));
          } else {
            video.addEventListener('loadedmetadata', function onMeta() {
              video.removeEventListener('loadedmetadata', onMeta);
              span.textContent = formatDuration(Math.floor(video.duration));
            });
          }
        }
      }
    });
  }

  /* --------------------------------------------------
   * A) 動画ファイル → サムネイル画像
   * -------------------------------------------------- */
  const drop         = document.getElementById('mainDrop');
  const input        = document.getElementById('contentFile');
  const details      = document.getElementById('details');


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
      // フォーム用動画プレビュー
      if (window.videoPreviewWrapper) {
        videoPreviewWrapper.innerHTML = '';
        const video = document.createElement('video');
        video.id = 'formVideoPreview';
        video.src = URL.createObjectURL(file);
        video.controls = true;
        video.muted = true;
        video.playsInline = true;
        video.style.maxWidth = '100%';
        video.style.maxHeight = '90px';
        videoPreviewWrapper.appendChild(video);
      }

      // サムネイル画像プレビュー
      if (window.thumbnailImagePreview) {
        thumbnailImagePreview.src = thumbnailUrl;
        thumbnailImagePreview.style.display = 'block';
      }

      // 右側プレビューエリア（スマホ風）は従来通り
      previewArea.innerHTML = '';
      const previewVideo = document.createElement('video');
      previewVideo.id = 'previewThumbnailVideo';
      previewVideo.classList.add('ep-thumb-video');
      previewVideo.src = URL.createObjectURL(file);
      previewVideo.controls = true;
      previewVideo.muted = true;
      previewVideo.playsInline = true;
      previewArea.appendChild(previewVideo);

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
        // duration取得とinputセット
        const totalSeconds = Math.floor(video.duration);
        // hh:mm:ss形式でセット
        const durIn = document.getElementById('duration');
        if (durIn) {
          durIn.value = formatDuration(totalSeconds);
          durIn.dispatchEvent(new Event('input'));
        }
        // 秒数もhidden inputにセット
        const durationSecondsInput = document.getElementById('durationSeconds');
        if (durationSecondsInput) {
          durationSecondsInput.value = totalSeconds;
        }
        // サムネイル生成のため先頭フレームへ
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
  const episodeInfoLine = document.getElementById('episodeInfoLine'); // 2行までに制限
  const combinedTextEl  = document.getElementById('combinedText');    // [タイトル + スペース + あらすじ]
  const toggleMoreEl    = document.getElementById('toggleMore');

  // タイトルとあらすじの結合テキストの管理
  if (episodeInfoLine && combinedTextEl && toggleMoreEl && titleInput && descInput) {
    let fullText = '';
    let isExpanded = false;

    function updateCombinedText() {
      const titleVal = titleInput.value.trim() || 'エピソードタイトル：';
      const descVal  = descInput.value.trim() || 'あらすじ';
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
        // 溢れてない → リンクを隐す
        toggleMoreEl.classList.add('hidden');
      }
    }
    
    toggleMoreEl.addEventListener('click', () => {
      isExpanded = !isExpanded;
      updateCombinedText();
      toggleMoreEl.textContent = isExpanded ? '---閉じる---' : '---続きを見る---';
    });
    
    // 入力との連携を設定
    titleInput.addEventListener('input', updateCombinedText);
    descInput.addEventListener('input', updateCombinedText);
    
    // 初期化
    updateCombinedText();
  }

  /* --------------------------------------------------
   * C) 時間 / 価格 → リアルタイム反映
   * -------------------------------------------------- */
  const durIn = document.getElementById('duration');
  const previewDuration = document.getElementById('previewDuration');

  // 時間表示のリアルタイム更新
  if (durIn && previewDuration) {
    durIn.addEventListener('input', () => {
      const val = durIn.value;
      previewDuration.textContent = val || '00:00:00';
    });
  }
  
  // 注意: 価格の処理は既に上部で実装済み

  /* --------------------------------------------------
   * D) 「詳細」ボタンでレーティング等をトグル表示
   * -------------------------------------------------- */
  const toggleExtraBtn = document.getElementById('toggleExtra');
  const previewExtra   = document.getElementById('previewExtra');
  
  // 詳細情報のトグル表示
  if (toggleExtraBtn && previewExtra) {
    toggleExtraBtn.addEventListener('click', () => {
      previewExtra.classList.toggle('hidden');
    });
  }

  /* --------------------------------------------------
   * E) フォーム送信時に送信ボタンを一度だけ押せるようにし、ローディングスピナーとテキストを表示
   * -------------------------------------------------- */
  const episodeForm = document.getElementById('episodeForm');
  const submitBtn = document.getElementById('submitEpisodeBtn');
  const submitBtnText = document.getElementById('submitEpisodeBtnText');
  const submitBtnSpinner = document.getElementById('submitEpisodeBtnSpinner');
  
  // アップロードオーバーレイ要素
  const uploadOverlay = document.getElementById('uploadOverlay');
  const uploadProgressBar = document.getElementById('uploadProgressBar');
  const uploadProgressPercent = document.getElementById('uploadProgressPercent');
  const uploadComplete = document.getElementById('uploadComplete');
  const goToWorkBtn = document.getElementById('goToWorkBtn');
  
  if (episodeForm && submitBtn && submitBtnText && submitBtnSpinner) {
    episodeForm.addEventListener('submit', function(e) {
      e.preventDefault(); // フォームのデフォルト送信を防止
      
      // 二重送信防止
      submitBtn.disabled = true;
      submitBtnText.style.display = 'none';
      submitBtnSpinner.style.display = '';
      
      // アップロードオーバーレイを表示
      uploadOverlay.classList.add('active');
      
      // アップロード完了表示を非表示にする
      uploadComplete.style.display = 'none';
      
      // 進捗表示の管理関数
      function toggleProgressElements(show) {
        const progressContainer = document.querySelector('.upload-progress-container');
        if (progressContainer) progressContainer.style.display = show ? 'block' : 'none';
        document.querySelector('.upload-progress').style.display = show ? 'block' : 'none';
        uploadProgressBar.style.display = show ? 'block' : 'none';
        uploadProgressBar.style.width = show ? '0%' : '0%'; // 表示時に幅をリセット
        uploadProgressPercent.style.display = show ? 'block' : 'none';
        uploadProgressPercent.textContent = show ? '0%' : '0%'; // 表示時にテキストもリセット
      }
      
      // 進捗バーの初期化と表示設定
      uploadProgressBar.style.width = '0%';
      uploadProgressBar.style.background = 'linear-gradient(to right, #0088ff, #00c3ff, #00ffea)';
      uploadProgressPercent.textContent = '0%';
      
      // 進捗表示要素を表示
      toggleProgressElements(true);
      
      // 強制的にバーの初期化（念のため）
      setTimeout(() => {
        uploadProgressBar.style.width = '0%';
        uploadProgressPercent.textContent = '0%';
      }, 50);
      
      // 進捗バーの色を更新する関数
      function updateProgressColor(progress) {
        const uploadProgressPercent = document.getElementById('uploadProgressPercent');
        
        if (uploadProgressPercent) {
          // 進行状況に応じた色の定義
          const colors = [
            { threshold: 30, color: '#00a8ff' },  // 青系
            { threshold: 60, color: '#00d0ff' },  // 緑系
            { threshold: 85, color: '#00e5ff' },  // 水色
            { threshold: 101, color: '#00ffea' }  // 完了に近い
          ];
          
          // 進行状況に応じた色を選択
          const colorInfo = colors.find(c => progress < c.threshold) || colors[colors.length - 1];
          uploadProgressPercent.style.color = colorInfo.color;
        }
      }
      
      // フォームデータの取得
      const formData = new FormData(episodeForm);
      
      // ステータスメッセージは固定のものを使用
      const statusText = document.getElementById('uploadStatusText');
      if (statusText) statusText.textContent = 'アップロード中...';
      
      // XMLHttpRequestを使用してアップロード進行状況を取得
      const xhr = new XMLHttpRequest();
      
      // リクエストの設定
      xhr.open('POST', episodeForm.action, true);
      
      // アップロード進行状況のイベントリスナー
      xhr.upload.addEventListener('progress', function(event) {
        if (event.lengthComputable) {
          // イベントのデータが正しく計算可能な場合
          console.log(`Progress: ${event.loaded} / ${event.total}`);
          const progress = Math.round((event.loaded / event.total) * 100);
          console.log(`Progress percentage: ${progress}%`);
          
          // 進捗バーとパーセント表示を更新
          uploadProgressBar.style.width = `${progress}%`;
          uploadProgressBar.style.display = 'block';
          uploadProgressPercent.textContent = `${progress}%`;
          
          // 進行状況に応じて色を変更
          updateProgressColor(progress);
          
          // 進行状況のメッセージは固定のものを使用
        }
      });
      
      // アップロード完了時のイベントリスナー
      xhr.addEventListener('load', function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          // ステータスメッセージは固定のものを使用
          
          // 少し待ってから完了メッセージを表示
          setTimeout(() => {
            // アップロード完了時は進捗表示要素を全て非表示にする
            document.querySelector('.upload-message').style.display = 'none';
            
            // 進捗表示要素を非表示にする
            toggleProgressElements(false);
            
            // 完了メッセージを表示
            uploadComplete.style.display = 'block';
            
            // 作品IDを取得（フォームのアクションURLから）
            const workId = episodeForm.action.split('/works/')[1].split('/episodes')[0];
            
            // カウントダウン表示用の要素
            const countdownEl = document.getElementById('redirectCountdown');
            let countdown = 3; // 3秒からカウントダウン
            
            // 「続けて追加する」ボタンの処理
            const continueAddBtn = document.getElementById('continueAddBtn');
            if (continueAddBtn) {
              continueAddBtn.addEventListener('click', () => {
                // カウントダウンをキャンセル
                clearInterval(countdownInterval);
                
                // オーバーレイを非表示にして再度アップロードできる状態に戻す
                uploadOverlay.classList.remove('active');
                submitBtn.disabled = false;
                submitBtnText.style.display = '';
                submitBtnSpinner.style.display = 'none';
                toggleProgressElements(false);
                uploadComplete.style.display = 'none';
                
                // 入力フォームをリセットする処理も可能
                // episodeForm.reset();
              });
            }
            
            // カウントダウン処理
            const countdownInterval = setInterval(() => {
              countdown--;
              if (countdownEl) {
                countdownEl.textContent = countdown;
              }
              if (countdown <= 0) {
                clearInterval(countdownInterval);
                window.location.href = `/works/${workId}`;
              }
            }, 1000);
          }, 500);
        } else {
          // エラー処理
          handleUploadError(`エピソードのアップロードに失敗しました。ステータスコード: ${xhr.status}`);
        }
      });
      
      // エラー発生時のイベントリスナー
      xhr.addEventListener('error', function() {
        handleUploadError('ネットワークエラーが発生しました。インターネット接続を確認して再度お試しください。');
      });
      
      // リクエスト送信
      xhr.send(formData);
      
      // エラー処理をまとめた関数
      function handleUploadError(message = 'エピソードのアップロードに失敗しました。もう一度お試しください。') {
        console.error('アップロードエラー:', message);
        alert(message);
        uploadOverlay.classList.remove('active');
        submitBtn.disabled = false;
        submitBtnText.style.display = '';
        submitBtnSpinner.style.display = 'none';
        toggleProgressElements(false);
      }
      
      // エラー発生時のイベントリスナー
      xhr.addEventListener('error', function() {
        handleUploadError();
      });
      
      // リクエストの送信
      xhr.send(formData);
    });
  }

  // サムネ動画の強制停止・エピソード時間表示を統一
  forcePauseThumbVideos();
  setEpisodeDurationSpans();

  // 既存エピソードリストのdescriptionトグル処理
  document.querySelectorAll('.episode-card').forEach(card => {
    const desc = card.querySelector('.ep-desc');
    const toggle = card.querySelector('.toggle-link');
    if (!desc || !toggle) return;

    // 2行を超えるか判定
    const isOverflowing = desc.scrollHeight > desc.clientHeight + 1;
    if (isOverflowing) {
      toggle.classList.remove('hidden');
    }

    toggle.addEventListener('click', () => {
      desc.classList.toggle('expanded');
      if (desc.classList.contains('expanded')) {
        toggle.textContent = '---閉じる---';
      } else {
        toggle.textContent = '---続きを見る---';
      }
    });
  });
});