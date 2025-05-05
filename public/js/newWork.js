  // === フォーム要素の取得 ===
  const workForm       = document.getElementById('workForm');
  const publishButton  = document.getElementById('publishButton');
  const loadingOverlay = document.getElementById('loadingOverlay');

  const thumbnailInput       = document.getElementById('thumbnail');
  const thumbnailSelectBtn   = document.getElementById('thumbnailSelectBtn');
  const thumbnailFileName    = document.getElementById('thumbnailFileName');

  const thumbnailVideoInput  = document.getElementById('thumbnailVideo');
  const thumbnailVideoSelectBtn = document.getElementById('thumbnailVideoSelectBtn');
  const thumbnailVideoFileName  = document.getElementById('thumbnailVideoFileName');

  // ※ プログレスバー関連の要素は使わなくなるのでコメントアウトしてもOK
  const uploadProgress  = document.getElementById('uploadProgress');
  const progressBar     = document.getElementById('progressBar');
  const progressText    = document.getElementById('progressText');

  // === プレビュー要素の取得 ===
  const previewWrapper  = document.getElementById('previewWrapper');
  const previewImage    = document.getElementById('previewImage');
  const previewVideo    = document.getElementById('previewVideo');
  const placeholderOverlay = document.getElementById('placeholderOverlay');

  const previewTitle    = document.getElementById('previewTitle');
  const toggleExtraBtn  = document.getElementById('toggleExtra');
  const previewExtra    = document.getElementById('previewExtra');
  const previewRating   = document.getElementById('previewRating');
  const previewYear     = document.getElementById('previewYear');
  const previewCast     = document.getElementById('previewCast');
  const previewStudio   = document.getElementById('previewStudio');

  // 入力フォーム
  const titleInput       = document.getElementById('title');
  const ratingSelect     = document.getElementById('rating');
  const releaseDateInput = document.getElementById('releaseDate');
  const castInput        = document.getElementById('cast');
  const studioInput      = document.getElementById('studio');
  const categorySelect   = document.getElementById('category'); // 必要に応じて

  // ---------------------------------------------
  // 1. サムネイル画像選択 → プレビュー
  // ---------------------------------------------
  thumbnailSelectBtn.addEventListener('click', () => {
    thumbnailInput.click();
  });

  thumbnailInput.addEventListener('change', () => {
    if (!thumbnailInput.files || thumbnailInput.files.length === 0) return;
    const file = thumbnailInput.files[0];
    thumbnailFileName.textContent = `選択中: ${file.name}`;

    // 画像プレビュー
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewImage.classList.remove('hidden');
    };
    reader.readAsDataURL(file);

    placeholderOverlay.classList.add('hidden');
    previewWrapper.classList.remove('empty-thumb');
  });

  // ---------------------------------------------
  // 2. サムネイル動画選択 → プレビュー
  // ---------------------------------------------
  thumbnailVideoSelectBtn.addEventListener('click', () => {
    thumbnailVideoInput.click();
  });

  thumbnailVideoInput.addEventListener('change', () => {
    if (!thumbnailVideoInput.files || thumbnailVideoInput.files.length === 0) return;
    const file = thumbnailVideoInput.files[0];
    thumbnailVideoFileName.textContent = `選択中: ${file.name}`;

    const reader = new FileReader();
    reader.onload = (e) => {
      previewVideo.src = e.target.result;
    };
    reader.readAsDataURL(file);

    previewVideo.classList.remove('hidden');
  });

  // プレビュー領域マウスオーバー → 動画再生
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
    previewVideo.currentTime = 0;
    if (previewImage.src) {
      previewVideo.classList.add('hidden');
      previewImage.classList.remove('hidden');
    }
  });

  // ---------------------------------------------
  // 3. タイトル → リアルタイム反映
  // ---------------------------------------------
  titleInput.addEventListener('input', () => {
    previewTitle.textContent = titleInput.value.trim() || '作品タイトル';
  });

  // ---------------------------------------------
  // 4. レーティング → リアルタイム反映
  // ---------------------------------------------
  ratingSelect.addEventListener('change', () => {
    let ratingText = '';
    switch (ratingSelect.value) {
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
  releaseDateInput.addEventListener('keydown', (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab'];
    if (allowed.includes(e.key)) return;
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
    previewCast.textContent   = castInput.value.trim()   || '-';
    previewStudio.textContent = studioInput.value.trim() || '-';
  }
  castInput.addEventListener('input', updateCastStudio);
  studioInput.addEventListener('input', updateCastStudio);

  // ---------------------------------------------
  // 7. カテゴリー (あれば)
  // ---------------------------------------------
  if (categorySelect) {
    categorySelect.addEventListener('change', () => {
      // 任意の処理
    });
  }

  // ---------------------------------------------
  // 8. 「詳細」ボタンでプレビューの詳細をトグル
  // ---------------------------------------------
  toggleExtraBtn.addEventListener('click', () => {
    previewExtra.classList.toggle('hidden');
  });

  // ---------------------------------------------
  // 9. ページロード時に一度反映
  // ---------------------------------------------
  window.addEventListener('DOMContentLoaded', () => {
    thumbnailInput.dispatchEvent(new Event('change'));
    titleInput.dispatchEvent(new Event('input'));
    ratingSelect.dispatchEvent(new Event('change'));
    releaseDateInput.dispatchEvent(new Event('input'));
    castInput.dispatchEvent(new Event('input'));
    studioInput.dispatchEvent(new Event('input'));
  });

  // ---------------------------------------------
  // 10. フォーム送信時の処理 (通常送信)
  // ---------------------------------------------
  workForm.addEventListener('submit', (e) => {
    // すでに disabled なら何もしない
    if (publishButton.disabled) return;

    // ボタンを無効化して多重送信を防ぐ
    publishButton.disabled = true;

    // ローディング用のオーバーレイを表示 (任意)
    loadingOverlay.classList.remove('hidden');

    // ※ ここでは e.preventDefault() はしない。
    //    → 通常のフォーム送信としてサーバーへPOSTし、
    //       サーバー側の res.redirect(...) によって
    //       ブラウザが自動的にリダイレクトを追跡します。
  });

  // ---------------------------------------------
  // 11. プログレスUIの表示 (今回使わなくなります)
  // ---------------------------------------------
  function showProgressUI() {
    uploadProgress.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
  }
