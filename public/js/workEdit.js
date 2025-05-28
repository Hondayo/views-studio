// public/js/workEdit.js

document.addEventListener('DOMContentLoaded', () => {

  // 1) DOM要素取得
  const thumbnailInput     = document.getElementById('thumbnail');
  const thumbnailSelectBtn = document.getElementById('thumbnailSelectBtn');
  const thumbnailFileName  = document.getElementById('thumbnailFileName');

  const thumbnailVideoInput    = document.getElementById('thumbnailVideo');
  const thumbnailVideoSelectBtn = document.getElementById('thumbnailVideoSelectBtn');
  const thumbnailVideoFileName  = document.getElementById('thumbnailVideoFileName');

  const titleInput        = document.getElementById('title');
  const descriptionInput  = document.getElementById('description');
  const ratingSelect      = document.getElementById('rating');
  const releaseDateInput  = document.getElementById('releaseDate');
  const castInput         = document.getElementById('cast');
  const studioInput       = document.getElementById('studio');
  const tagsInput         = document.getElementById('tags');

  // プレビュー関連
  const previewThumbnailWrapper = document.getElementById('previewThumbnailWrapper');
  const previewThumbnailImg = document.getElementById('previewThumbnailImg');
  const previewThumbnailVideo = document.getElementById('previewThumbnailVideo');
  const placeholderOverlay = document.querySelector('.placeholder-overlay');

  const previewTitle     = document.getElementById('previewTitle');
  const workDescription  = document.getElementById('workDescription');
  const toggleDescription = document.getElementById('toggleDescription');
  const previewYear      = document.querySelector('.year-label');
  const previewRating    = document.querySelector('.rating-badge');
  const previewCast      = document.getElementById('previewCast');
  const previewStudio    = document.getElementById('previewStudio');

  const previewExtra     = document.getElementById('previewExtra');
  const toggleExtraBtn   = document.getElementById('toggleExtra');

  // フォームやボタン
  const editWorkForm     = document.getElementById('editWorkForm');
  const saveButton       = document.getElementById('saveButton');
  const loadingOverlay   = document.getElementById('loadingOverlay');

  // 2) セクション選択機能
  const sectionElements = document.querySelectorAll('.section-selectable');
  
  // セクションをクリックしたときの処理
  sectionElements.forEach(section => {
    section.addEventListener('click', () => {
      // すべてのセクションからactiveクラスを削除
      sectionElements.forEach(el => el.classList.remove('active'));
      // クリックしたセクションにactiveクラスを追加
      section.classList.add('active');
      
      // セクションに対応するフォームフィールドにフォーカス
      const sectionType = section.dataset.section;
      
      switch (sectionType) {
        case 'thumbnail':
          // サムネイル選択ボタンをクリック
          thumbnailSelectBtn.focus();
          thumbnailSelectBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
          
        case 'title':
          // タイトル入力欄にフォーカス
          titleInput.focus();
          titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
          
        case 'description':
          // あらすじ入力欄にフォーカス
          descriptionInput.focus();
          descriptionInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
          
        case 'details':
          // 詳細情報セクションを開いてフォーカス
          const detailsElement = document.querySelector('.detail-group details');
          if (detailsElement && !detailsElement.open) {
            detailsElement.open = true;
          }
          ratingSelect.focus();
          ratingSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
          
        case 'episode':
          // エピソード編集ページへスムーズに移動
          const episodeId = section.dataset.episodeId;
          if (episodeId) {
            const workId = window.location.pathname.split('/works/')[1].split('/')[0];
            
            // 変更があれば確認を表示
            if (hasUnsavedChanges()) {
              if (!confirm('編集中の内容があります\n変更を破棄してエピソード編集画面に移動しますか？')) {
                return;
              }
            }
            
            // ローディング表示
            loadingOverlay.classList.remove('hidden');
            
            // ブラウザ履歴に記録してURLを更新
            const newUrl = `/works/${workId}/episodes/${episodeId}/edit`;
            history.pushState({ workId, episodeId }, '', newUrl);
            
            // エピソード編集画面を読み込み
            fetch(newUrl)
              .then(response => {
                if (!response.ok) {
                  throw new Error('エピソードデータの取得に失敗しました');
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
                console.error('Error loading episode:', error);
                // エラー時は通常のページ遷移にフォールバック
                window.location.href = newUrl;
              });
          }
          break;
      }
    });
  });

  // 3) ファイル選択ボタンの制御
  if (thumbnailSelectBtn && thumbnailInput) {
    thumbnailSelectBtn.addEventListener('click', () => {
      thumbnailInput.click();
    });
  }
  
  if (thumbnailVideoSelectBtn && thumbnailVideoInput) {
    thumbnailVideoSelectBtn.addEventListener('click', () => {
      thumbnailVideoInput.click();
    });
  }

  // 4) サムネ画像プレビュー
  if (thumbnailInput && thumbnailFileName && previewThumbnailImg) {
    thumbnailInput.addEventListener('change', () => {
      if (!thumbnailInput.files || thumbnailInput.files.length === 0) return;
      const file = thumbnailInput.files[0];
      thumbnailFileName.textContent = `選択中: ${file.name}`;

      const reader = new FileReader();
      reader.onload = e => {
        previewThumbnailImg.src = e.target.result;
      };
      reader.readAsDataURL(file);

      // 表示切り替え
      previewThumbnailImg.style.display = 'block';
      if (placeholderOverlay) {
        placeholderOverlay.classList.add('hidden');
      }
    });
  }

  // 5) サムネ動画プレビュー
  if (thumbnailVideoInput && thumbnailVideoFileName) {
    thumbnailVideoInput.addEventListener('change', () => {
      if (!thumbnailVideoInput.files || thumbnailVideoInput.files.length === 0) return;
      const file = thumbnailVideoInput.files[0];
      thumbnailVideoFileName.textContent = `選択中: ${file.name}`;

      if (previewThumbnailVideo) {
        const videoURL = URL.createObjectURL(file);
        previewThumbnailVideo.src = videoURL;
      }
    });
  }

  // 6) マウスホバーで画像→動画再生
  if (previewThumbnailWrapper && previewThumbnailImg && previewThumbnailVideo) {
    previewThumbnailWrapper.addEventListener('mouseenter', () => {
      if (previewThumbnailVideo.src) {
        previewThumbnailImg.style.display = 'none';
        previewThumbnailVideo.style.display = 'block';
        previewThumbnailVideo.currentTime = 0;
        previewThumbnailVideo.play().catch(e => console.log('Video playback error:', e));
      }
    });
    
    previewThumbnailWrapper.addEventListener('mouseleave', () => {
      if (previewThumbnailVideo.src) {
        previewThumbnailVideo.pause();
        previewThumbnailVideo.style.display = 'none';
        previewThumbnailImg.style.display = 'block';
      }
    });
  }

  // 7) テキスト項目 リアルタイム反映
  // タイトル
  if (titleInput && previewTitle) {
    const updateTitle = () => {
      const val = titleInput.value.trim() || '作品タイトル';
      previewTitle.textContent = val;
    };
    titleInput.addEventListener('input', updateTitle);
    titleInput.addEventListener('change', updateTitle);
  }
  
  // あらすじ
  if (descriptionInput && workDescription) {
    const updateDescription = () => {
      const val = descriptionInput.value.trim();
      workDescription.textContent = val || 'あらすじが未設定です';
      
      // 行数によって「続きを見る」ボタンを表示/非表示
      if (toggleDescription) {
        const lineHeight = parseInt(window.getComputedStyle(workDescription).lineHeight);
        const height = workDescription.scrollHeight;
        const lines = height / lineHeight;
        
        if (lines > 2) {
          toggleDescription.classList.remove('hidden');
        } else {
          toggleDescription.classList.add('hidden');
        }
      }
    };
    descriptionInput.addEventListener('input', updateDescription);
    descriptionInput.addEventListener('change', updateDescription);
    // 初期化
    setTimeout(updateDescription, 100);
  }
  
  // 「続きを見る」トグル機能
  if (toggleDescription && workDescription) {
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
  
  // レーティング
  if (ratingSelect && previewRating) {
    const updateRating = () => {
      const val = ratingSelect.value;
      if (val) {
        previewRating.textContent = val;
        previewRating.classList.remove('hidden');
      } else {
        previewRating.textContent = '未設定';
        previewRating.classList.add('hidden');
      }
    };
    ratingSelect.addEventListener('change', updateRating);
  }
  
  // 公開年
  if (releaseDateInput && previewYear) {
    const updateYear = () => {
      const val = releaseDateInput.value.trim();
      if (val) {
        previewYear.textContent = val;
        previewYear.classList.remove('hidden');
      } else {
        previewYear.textContent = '未設定';
        previewYear.classList.add('hidden');
      }
    };
    releaseDateInput.addEventListener('input', updateYear);
    releaseDateInput.addEventListener('change', updateYear);
  }
  
  // キャスト
  if (castInput && previewCast) {
    const updateCast = () => {
      const val = castInput.value.trim();
      previewCast.textContent = val || '未設定';
    };
    castInput.addEventListener('input', updateCast);
    castInput.addEventListener('change', updateCast);
  }
  
  // 制作会社
  if (studioInput && previewStudio) {
    const updateStudio = () => {
      const val = studioInput.value.trim();
      previewStudio.textContent = val || '未設定';
    };
    studioInput.addEventListener('input', updateStudio);
    studioInput.addEventListener('change', updateStudio);
  }
  
  // 8) 詳細情報トグルボタン
  if (toggleExtraBtn && previewExtra) {
    toggleExtraBtn.addEventListener('click', () => {
      previewExtra.classList.toggle('hidden');
    });
  }
  
  // 9) エピソードあらすじの「続きを見る」トグル機能
  const epDescs = document.querySelectorAll('.ep-desc');
  epDescs.forEach(desc => {
    const toggleLink = desc.nextElementSibling;
    if (toggleLink && toggleLink.classList.contains('toggle-link')) {
      // 行数チェック
      const checkLines = () => {
        const lineHeight = parseInt(window.getComputedStyle(desc).lineHeight);
        const height = desc.scrollHeight;
        const lines = height / lineHeight;
        
        if (lines > 2) {
          toggleLink.classList.remove('hidden');
        } else {
          toggleLink.classList.add('hidden');
        }
      };
      
      // クリックイベント
      toggleLink.addEventListener('click', () => {
        if (desc.classList.contains('expanded')) {
          desc.classList.remove('expanded');
          toggleLink.textContent = '---続きを見る---';
        } else {
          desc.classList.add('expanded');
          toggleLink.textContent = '---閉じる---';
        }
      });
      
      // 初期化
      setTimeout(checkLines, 100);
    }
  });
  
  // 10) フォーム送信時のローディング表示
  if (editWorkForm && loadingOverlay) {
    editWorkForm.addEventListener('submit', () => {
      loadingOverlay.classList.remove('hidden');
    });
  }
  
  // 11) 未保存の変更があるかチェックする関数
  function hasUnsavedChanges() {
    // ファイル選択のチェック
    if ((thumbnailInput && thumbnailInput.files && thumbnailInput.files.length > 0) || 
        (thumbnailVideoInput && thumbnailVideoInput.files && thumbnailVideoInput.files.length > 0)) {
      return true;
    }
    
    // フォームの各フィールドが変更されているかチェック
    // タイトルの変更をチェック
    if (titleInput && previewTitle && titleInput.value !== previewTitle.textContent) {
      return true;
    }
    
    // あらすじの変更をチェック
    if (descriptionInput && workDescription) {
      const cleanDesc = workDescription.textContent.trim();
      const inputDesc = descriptionInput.value.trim();
      // 「あらすじが未設定です」というデフォルトテキストの場合は空と比較
      const displayDesc = cleanDesc === 'あらすじが未設定です' ? '' : cleanDesc;
      if (inputDesc !== displayDesc) {
        return true;
      }
    }
    
    // その他の変更チェックは省略していますが、必要に応じて追加可能
    
    return false;
  }
  
  // 12) ブラウザの戻るボタン対応
  window.addEventListener('popstate', (event) => {
    // 変更があれば確認を表示
    if (hasUnsavedChanges()) {
      if (confirm('編集中の内容があります\n変更を破棄してページを移動しますか？')) {
        // ページをリロードしてステートを合わせる
        window.location.reload();
      } else {
        // キャンセルの場合は元のステートに戻す
        const currentPath = window.location.pathname;
        history.pushState(null, '', currentPath);
      }
    } else {
      // 変更がない場合はページをリロード
      window.location.reload();
    }
  });
});
