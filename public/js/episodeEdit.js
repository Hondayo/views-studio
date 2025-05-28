/**
 * エピソード編集画面のJavaScript機能
 * - エピソードカードの選択
 * - 編集フォームの入力内容をリアルタイムでプレビュー反映
 * - 動画アップロード時の自動処理
 */
document.addEventListener('DOMContentLoaded', () => {
  // --- 現在編集中のエピソードIDを取得 ---
  let currentEpisodeId = document.querySelector('#episodeForm').getAttribute('data-episode-id');
  let currentEpisodeCard = document.getElementById('episode-card-' + currentEpisodeId);
  const workId = document.querySelector('#episodeForm').getAttribute('data-work-id');
  
  // --- フォーム要素 ---
  const episodeForm = document.getElementById('episodeForm');
  const thumbnailInput = document.getElementById('thumbnailImageInput');
  const thumbnailPreview = document.getElementById('thumbnailImagePreview');
  const titleInput = document.getElementById('title');
  const priceInput = document.getElementById('price');
  const descInput = document.getElementById('description');
  const durationInput = document.getElementById('duration');
  const durationSecondsInput = document.getElementById('durationSeconds');
  const episodeNumberInput = document.getElementById('episodeNumber');
  const contentFileInput = document.getElementById('contentFile');
  const mainDrop = document.getElementById('mainDrop');
  const videoPreviewWrapper = document.getElementById('videoPreviewWrapper');
  
  // --- 現在編集中のエピソードカードの要素 ---
  let cardTitle, cardPrice, cardDesc, cardDuration;
  
  // エピソードカードのクリックイベントをページ遷移からAjax更新に変更
  document.querySelectorAll('.episode-card').forEach(card => {
    // クリックイベントを削除してページ遷移を防止
    card.removeAttribute('onclick');
    
    // 新しいクリックイベントを追加
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const episodeId = card.getAttribute('data-episode-id');
      
      // 同じエピソードなら何もしない
      if (episodeId === currentEpisodeId) return;
      
      // URLを更新（ブラウザの履歴に記録）
      const newUrl = `/works/${workId}/episodes/${episodeId}/edit`;
      history.pushState({ episodeId }, '', newUrl);
      
      // エピソードデータをAjaxで取得
      fetchEpisodeData(episodeId);
    });
  });
  
  /**
   * Ajaxでエピソードデータを取得してフォームを更新
   */
  function fetchEpisodeData(episodeId) {
    // ローディング表示
    document.body.classList.add('loading');
    
    // Ajaxリクエストでエピソードデータを取得
    fetch(`/api/works/${workId}/episodes/${episodeId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Episode data fetch failed');
        }
        return response.json();
      })
      .then(data => {
        // フォーム要素を更新
        updateFormWithEpisodeData(data.episode);
        
        // 現在のエピソードIDとカードを更新
        currentEpisodeId = episodeId;
        currentEpisodeCard = document.getElementById('episode-card-' + episodeId);
        
        // 編集中クラスを付け替え
        document.querySelectorAll('.episode-card').forEach(c => {
          c.classList.remove('current-editing');
        });
        currentEpisodeCard.classList.add('current-editing');
        
        // 編集中カードの要素を再取得
        cardTitle = currentEpisodeCard.querySelector('.ep-title');
        cardPrice = currentEpisodeCard.querySelector('.ep-price');
        cardDesc = currentEpisodeCard.querySelector('.ep-desc');
        cardDuration = currentEpisodeCard.querySelector('.ep-duration');
        
        // スクロール位置を調整
        scrollToCurrentEpisode();
        
        // ローディング表示を非表示
        document.body.classList.remove('loading');
      })
      .catch(error => {
        console.error('Error fetching episode data:', error);
        // エラー時は通常のページ遷移にフォールバック
        window.location.href = `/works/${workId}/episodes/${episodeId}/edit`;
      });
  }
  
  /**
   * エピソードデータでフォームを更新
   */
  function updateFormWithEpisodeData(episode) {
    // 各フォーム要素を更新
    titleInput.value = episode.title || '';
    descInput.value = episode.description || '';
    priceInput.value = episode.price || 0;
    durationInput.value = episode.duration || '';
    durationSecondsInput.value = episode.durationSeconds || '';
    episodeNumberInput.value = episode.episodeNumber || '';
    
    // サムネイル画像を更新
    if (thumbnailPreview && episode.thumbnailUrl) {
      thumbnailPreview.src = episode.thumbnailUrl;
      thumbnailPreview.style.display = 'block';
      thumbnailPreview.classList.remove('hidden');
    } else if (thumbnailPreview) {
      thumbnailPreview.style.display = 'none';
      thumbnailPreview.classList.add('hidden');
    }
    
    // 動画プレビューを更新
    if (videoPreviewWrapper && episode.cloudinaryUrl) {
      videoPreviewWrapper.innerHTML = '';
      const video = document.createElement('video');
      video.src = episode.cloudinaryUrl;
      video.controls = true;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      videoPreviewWrapper.appendChild(video);
    } else if (videoPreviewWrapper) {
      videoPreviewWrapper.innerHTML = '';
    }
    
    // フォームのaction属性を更新
    episodeForm.action = `/works/${workId}/episodes/${episode._id}/edit`;
    episodeForm.setAttribute('data-episode-id', episode._id);
  }
  
  // ブラウザの戻るボタン対応
  window.addEventListener('popstate', (event) => {
    if (event.state && event.state.episodeId) {
      fetchEpisodeData(event.state.episodeId);
    }
  });
  
  /**
   * 編集中のエピソードカードをプレビュー画面に表示（スクロール位置調整）
   */
  function scrollToCurrentEpisode() {
    if (!currentEpisodeCard) return;
    
    // プレビューペインとスクロール要素を取得
    const episodeListScroll = document.querySelector('.episode-list-scroll');
    
    if (episodeListScroll && currentEpisodeCard) {
      // 編集中カードの要素を取得
      cardTitle = currentEpisodeCard.querySelector('.ep-title');
      cardPrice = currentEpisodeCard.querySelector('.ep-price');
      cardDesc = currentEpisodeCard.querySelector('.ep-desc');
      cardDuration = currentEpisodeCard.querySelector('.ep-duration');
      
      // CSSクラスを追加して編集中のエピソードを強調表示
      currentEpisodeCard.classList.add('current-editing');
      
      // スクロール位置を調整（カードが中央に表示されるように）
      const scrollOffset = currentEpisodeCard.offsetTop - episodeListScroll.offsetTop - 100;
      episodeListScroll.scrollTop = scrollOffset;
    }
  }
  
  // ページ読み込み時に編集中エピソードまでスクロール
  setTimeout(scrollToCurrentEpisode, 300);
  
  /**
   * 作品情報部分をクリックした時に作品編集画面にスムーズに遷移
   */
  const workTitleElement = document.getElementById('previewTitle');
  const workThumbnailWrapper = document.getElementById('previewThumbnailWrapper');
  const workDescriptionElement = document.getElementById('workDescription');
  
  // 作品タイトルをクリックした時の処理
  if (workTitleElement) {
    workTitleElement.classList.add('section-selectable');
    workTitleElement.dataset.section = 'work-title';
    workTitleElement.innerHTML += '<div class="section-indicator">クリックで作品編集画面に移動</div>';
    
    workTitleElement.addEventListener('click', () => {
      navigateToWorkEdit();
    });
  }
  
  // 作品サムネイルをクリックした時の処理
  if (workThumbnailWrapper) {
    workThumbnailWrapper.classList.add('section-selectable');
    workThumbnailWrapper.dataset.section = 'work-thumbnail';
    workThumbnailWrapper.innerHTML += '<div class="section-indicator">クリックで作品編集画面に移動</div>';
    
    workThumbnailWrapper.addEventListener('click', () => {
      navigateToWorkEdit();
    });
  }
  
  // 作品あらすじをクリックした時の処理
  if (workDescriptionElement) {
    workDescriptionElement.classList.add('section-selectable');
    workDescriptionElement.dataset.section = 'work-description';
    workDescriptionElement.innerHTML += '<div class="section-indicator">クリックで作品編集画面に移動</div>';
    
    workDescriptionElement.addEventListener('click', () => {
      navigateToWorkEdit();
    });
  }
  
  /**
   * 作品編集画面にスムーズに遷移する関数
   */
  function navigateToWorkEdit() {
    // 変更があれば確認を表示
    if (hasUnsavedChanges()) {
      if (!confirm('編集中の内容があります\n変更を破棄して作品編集画面に移動しますか？')) {
        return;
      }
    }
    
    // ローディング表示
    document.body.classList.add('loading');
    
    // ブラウザ履歴に記録してURLを更新
    const newUrl = `/works/${workId}/edit`;
    history.pushState({ workId }, '', newUrl);
    
    // 作品編集画面を読み込み
    fetch(newUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('作品データの取得に失敗しました');
        }
        return response.text();
      })
      .then(html => {
        // ページ内容を更新
        document.open();
        document.write(html);
        document.close();
      })
      .catch(error => {
        console.error('Error loading work edit page:', error);
        // エラー時は通常のページ遷移にフォールバック
        window.location.href = newUrl;
      });
  }
  
  /**
   * 未保存の変更があるかチェックする関数
   */
  function hasUnsavedChanges() {
    // ファイル選択のチェック
    if ((thumbnailInput && thumbnailInput.files && thumbnailInput.files.length > 0) || 
        (contentFileInput && contentFileInput.files && contentFileInput.files.length > 0)) {
      return true;
    }
    
    // フォームの各フィールドが変更されているかチェック
    // キャンセルされた場合や変更がない場合は詳細チェックを省略
    
    return false;
  }

  /**
   * サムネイル画像更新関数
   */
  function updateThumbnailPreviews(imgSrc) {
    // 左フォームのサムネイルプレビュー更新
    const thumbnailImagePreview = document.getElementById('thumbnailImagePreview');
    if (thumbnailImagePreview) {
      thumbnailImagePreview.src = imgSrc;
      thumbnailImagePreview.style.display = 'block';
      thumbnailImagePreview.classList.remove('hidden');
    }
    
    // 一覧内の編集中エピソードカードのサムネイル更新
    if (currentEpisodeCard) {
      const cardThumb = currentEpisodeCard.querySelector('.ep-thumb-16x9');
      if (cardThumb) {
        cardThumb.innerHTML = '';
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = titleInput.value || 'サムネイル';
        img.classList.add('ep-thumb');
        cardThumb.appendChild(img);
      }
    }
  }
  
  // サムネイル画像変更イベント
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

  /**
   * タイトル更新関数
   */
  function updateTitlePreview() {
    const val = titleInput.value.trim();
    // 一覧内の編集中エピソードカードのタイトル更新
    if (cardTitle) {
      cardTitle.textContent = val;
    }
  }
  
  /**
   * あらすじ更新関数
   */
  function updateDescPreview() {
    const val = descInput.value.trim();
    // 一覧内の編集中エピソードカードのあらすじ更新
    if (cardDesc) {
      cardDesc.textContent = val;
      
      // 「続きを見る」ボタンの表示制御
      if (currentEpisodeCard) {
        const toggleLink = currentEpisodeCard.querySelector('.toggle-link');
        if (toggleLink && cardDesc) {
          // テキストの高さをチェック
          const lineHeight = parseInt(window.getComputedStyle(cardDesc).lineHeight);
          const height = cardDesc.scrollHeight;
          const lines = height / lineHeight;
          
          if (lines > 2) {
            toggleLink.classList.remove('hidden');
          } else {
            toggleLink.classList.add('hidden');
          }
        }
      }
    }
  }
  
  /**
   * 価格更新関数
   */
  function updatePricePreview() {
    const val = priceInput.value.trim();
    // 一覧内の編集中エピソードカードの価格更新
    if (cardPrice) {
      cardPrice.textContent = (!val || val === '0') ? '無料' : `${val}円`;
    }
  }
  
  // フォーム入力イベントの設定
  if (titleInput) {
    titleInput.addEventListener('input', updateTitlePreview);
    updateTitlePreview(); // 初期化
  }
  
  if (descInput) {
    descInput.addEventListener('input', updateDescPreview);
    updateDescPreview(); // 初期化
  }
  
  if (priceInput) {
    priceInput.addEventListener('input', updatePricePreview);
    updatePricePreview(); // 初期化
  }

  /**
   * 作品あらすじの「続きを見る」トグル機能
   */
  const workDescription = document.getElementById('workDescription');
  const toggleDescription = document.getElementById('toggleDescription');
  
  if (workDescription && toggleDescription) {
    // テキストの高さをチェック
    const lineHeight = parseInt(window.getComputedStyle(workDescription).lineHeight);
    const height = workDescription.scrollHeight;
    const lines = height / lineHeight;
    
    if (lines > 2) {
      toggleDescription.classList.remove('hidden');
      
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
    }
  }

  /**
   * エピソードカードの「続きを見る」トグル機能
   */
  document.querySelectorAll('.episode-card').forEach(card => {
    const desc = card.querySelector('.ep-desc');
    const toggle = card.querySelector('.toggle-link');
    
    if (desc && toggle) {
      // テキストの高さをチェック
      const lineHeight = parseInt(window.getComputedStyle(desc).lineHeight);
      const height = desc.scrollHeight;
      const lines = height / lineHeight;
      
      if (lines > 2) {
        toggle.classList.remove('hidden');
        
        // クリックイベント
        toggle.addEventListener('click', e => {
          e.stopPropagation(); // 親要素のクリックイベントを止める
          
          if (desc.classList.contains('expanded')) {
            desc.classList.remove('expanded');
            toggle.textContent = '---続きを見る---';
          } else {
            desc.classList.add('expanded');
            toggle.textContent = '---閉じる---';
          }
        });
      }
    }
  });

  /**
   * 詳細ボタンのトグル機能
   */
  const toggleExtraBtn = document.getElementById('toggleExtra');
  const previewExtra = document.getElementById('previewExtra');
  
  if (toggleExtraBtn && previewExtra) {
    toggleExtraBtn.addEventListener('click', () => {
      if (previewExtra.classList.contains('hidden')) {
        previewExtra.classList.remove('hidden');
        toggleExtraBtn.textContent = '閉じる';
      } else {
        previewExtra.classList.add('hidden');
        toggleExtraBtn.textContent = '詳細';
      }
    });
  }

  /**
   * 動画ファイルのドラッグ&ドロップ機能
   */
  if (mainDrop && contentFileInput) {
    // クリックでファイル選択ダイアログを開く
    mainDrop.addEventListener('click', () => {
      contentFileInput.click();
    });
    
    // ドラッグ&ドロップイベントの防止
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      mainDrop.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });
    
    // ドラッグオーバー時のスタイル変更
    ['dragenter', 'dragover'].forEach(eventName => {
      mainDrop.addEventListener(eventName, () => {
        mainDrop.classList.add('drag-over');
      }, false);
    });
    
    // ドラッグ終了時のスタイル元に戻す
    ['dragleave', 'drop'].forEach(eventName => {
      mainDrop.addEventListener(eventName, () => {
        mainDrop.classList.remove('drag-over');
      }, false);
    });
    
    // ドロップ時のファイル処理
    mainDrop.addEventListener('drop', e => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        contentFileInput.files = files;
        handleFileSelect(files[0]);
      }
    });
  }
  
  /**
   * 動画ファイル選択時の処理
   */
  function handleFileSelect(file) {
    if (!file || !file.type.startsWith('video/')) return;
    
    // プレビューの更新
    const videoPreviewWrapper = document.getElementById('videoPreviewWrapper');
    if (videoPreviewWrapper) {
      videoPreviewWrapper.innerHTML = '';
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.controls = true;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.borderRadius = '8px';
      
      // 動画の長さを取得して設定
      video.addEventListener('loadedmetadata', () => {
        // 秒数を取得
        const seconds = Math.floor(video.duration);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        
        // 表示用フォーマット (hh:mm:ss)
        const formattedDuration = h > 0
          ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
          : `${m}:${String(s).padStart(2, '0')}`;
        
        // 各要素に反映
        document.getElementById('duration').value = formattedDuration;
        document.getElementById('durationSeconds').value = seconds;
        
        // カード上の時間表示も更新
        if (cardDuration) {
          cardDuration.textContent = formattedDuration;
        }
      });
      
      videoPreviewWrapper.appendChild(video);
    }
  }
  
  // ファイル選択イベント
  if (contentFileInput) {
    contentFileInput.addEventListener('change', e => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  /**
   * フォーム送信時の処理
   */
  const form = document.getElementById('episodeForm');
  const submitBtn = document.getElementById('submitEpisodeBtn');
  const submitBtnText = document.getElementById('submitEpisodeBtnText');
  const submitBtnSpinner = document.getElementById('submitEpisodeBtnSpinner');

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      
      // ボタンを読み込み中表示に変更
      if (submitBtn && submitBtnText && submitBtnSpinner) {
        submitBtn.disabled = true;
        submitBtnText.style.display = 'none';
        submitBtnSpinner.style.display = 'inline-flex';
      }
      
      // フォームを送信
      form.submit();
    });
  }
});
