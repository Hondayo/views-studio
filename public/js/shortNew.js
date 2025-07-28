// ▼ 要素取得
const uploadSection = document.getElementById('uploadSection');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');

const progressArea = document.getElementById('progressArea');
const uploadedInfo = document.getElementById('uploadedInfo');
const progressBar = document.getElementById('progressBar');

const postContainer = document.getElementById('postContainer');
const descriptionInput = document.getElementById('descriptionInput');
const previewText = document.getElementById('previewText');
const replaceBtn = document.getElementById('replaceBtn');
const submitBtn = document.getElementById('submitBtn');
const searchLeadBtn = document.getElementById('searchLeadBtn'); // リード先を検索ボタン
const addHashTagBtn = document.getElementById('addHashTagBtn'); // ハッシュタグボタン

const replaceBtnInProgress = document.getElementById('replaceBtnInProgress');
const previewVideo = document.getElementById('previewVideo');

const workSelectionBlock = document.getElementById('workSelectionBlock');
const workSearchBtn = document.getElementById('workSearchBtn');
const workSearchInput = document.getElementById('workSearchInput');
const workList = document.getElementById('workList');
const confirmWorkBtn = document.getElementById('confirmWorkBtn');
const selectWorkButtonArea = document.getElementById('selectWorkButtonArea');

const episodeConfirmModal = document.getElementById('episodeConfirmModal');
const selectedWorkTitle = document.getElementById('selectedWorkTitle');
const goAddEpisodeBtn = document.getElementById('goAddEpisodeBtn');
const skipEpisodeBtn = document.getElementById('skipEpisodeBtn');

const episodeSelectModal = document.getElementById('episodeSelectModal');
const episodeList = document.getElementById('episodeList');
const decideEpisodeBtn = document.getElementById('decideEpisodeBtn');

const selectedContainer = document.getElementById('selectedContainer');
const selectedStatusText = document.getElementById('selectedStatusText');
const rechooseBtn = document.getElementById('rechooseBtn');

const leadSearchBtn = document.getElementById('leadSearchBtn');
const workSectionOverlay = document.getElementById('workSectionOverlay');
const closeWorkSelectionBtn = document.getElementById('closeWorkSelectionBtn');

let uploadedFile = null;
let selectedWorkId = null;
let selectedWorkTitleText = '';
let selectedEpisodeId = null;
let selectedEpisodeTitle = '';

// 説明文からタグと文章を分離する関数
function parseDescriptionAndTags(inputText) {
  console.log('入力テキスト:', inputText); // デバッグ用
  
  const tags = [];
  let workingText = inputText;
  
  // ハッシュタグを順次抽出（連続したハッシュタグに対応）
  let match;
  const hashtagRegex = /#([^\s#]+)/g;
  
  while ((match = hashtagRegex.exec(inputText)) !== null) {
    const cleanTag = match[1].trim(); // #を除去したタグ名
    if (cleanTag && !tags.includes(cleanTag)) {
      tags.push(cleanTag);
    }
  }
  
  console.log('抽出されたタグ:', tags); // デバッグ用
  
  // ハッシュタグを除去した文章部分を取得
  const textWithoutTags = inputText.replace(/#[^\s#]+/g, '').trim();
  console.log('タグ除去後のテキスト:', textWithoutTags); // デバッグ用
  
  return {
    description: textWithoutTags,
    tags: tags
  };
}

// ハッシュタグボタンのイベントリスナー
if (addHashTagBtn) {
  addHashTagBtn.addEventListener('click', function() {
    // 現在の値を取得
    const currentText = descriptionInput.value;
    
    // カーソルの位置を取得
    const cursorPos = descriptionInput.selectionStart;
    
    // カーソル位置にハッシュタグを挿入するか、カーソルが無ければ末尾に追加
    if (cursorPos !== null && cursorPos !== undefined) {
      const newText = currentText.substring(0, cursorPos) + '#' + currentText.substring(cursorPos);
      descriptionInput.value = newText;
      
      // カーソルを#の直後に移動
      descriptionInput.selectionStart = cursorPos + 1;
      descriptionInput.selectionEnd = cursorPos + 1;
    } else {
      // カーソル位置が不明な場合は末尾に追加
      descriptionInput.value = currentText + '#';
    }
    
    // フォーカスをテキストエリアに戻す
    descriptionInput.focus();
  });
}

// 初期化: 検索フォームを非表示
workSelectionBlock.style.display = 'none';

// ポップアップを開く関数
function openWorkSelection() {
  workSectionOverlay.style.display = 'block';
  workSelectionBlock.style.display = 'block';
  document.body.style.overflow = 'hidden'; // スクロール無効化
  fetchAndDisplayMyWorks(); // 自分の作品を読み込み表示
}

// ポップアップを閉じる関数
function closeWorkSelection() {
  workSectionOverlay.style.display = 'none';
  workSelectionBlock.style.display = 'none';
  document.body.style.overflow = 'auto'; // スクロール有効化
}

// リード先を検索ボタンクリックイベント
if (leadSearchBtn) {
  leadSearchBtn.addEventListener('click', openWorkSelection);
}

// 閉じるボタンクリックイベント
if (closeWorkSelectionBtn) {
  closeWorkSelectionBtn.addEventListener('click', closeWorkSelection);
}

// オーバーレイクリックイベント
if (workSectionOverlay) {
  workSectionOverlay.addEventListener('click', closeWorkSelection);
}

// リード先を検索ボタンのクリックイベント（リダイレクト）
if (searchLeadBtn) {
  searchLeadBtn.addEventListener('click', openWorkSelection);
}

// 検索入力フィールドのリセットは openWorkSelection に含める
document.addEventListener('DOMContentLoaded', () => {
  if (workSearchInput) {
    // 初期化時に入力フィールドをクリア
    workSearchInput.value = '';
  }
});

// 自分の作品を読み込んで表示する関数
async function fetchAndDisplayMyWorks() {
  try {
    // userId パラメータを使って自分の作品を取得（または必要なクエリパラメータ）
    const response = await fetch('/api/works');
    if (!response.ok) {
      throw new Error('作品データの取得に失敗しました');
    }
    const myWorks = await response.json();
    console.log('API Response - All Works:', myWorks);
    // API ですでに有料作品のみ返ってくる
    if (myWorks.length === 0) {
      workList.innerHTML = '<p style="text-align: center; padding: 20px;">表示可能な有料作品がありません</p>';
    } else {
      renderWorkCards(myWorks);
    }
    // グローバル保持
    window.myPaidWorks = myWorks;
  } catch (error) {
    console.error('作品の読み込みエラー:', error);
    workList.innerHTML = `<p style="text-align: center; padding: 20px;">エラーが発生しました: ${error.message}</p>`;
  }
}

// =============================
// (1) 動画アップロード処理
// =============================
uploadSection.addEventListener('dragover', handleDragOver);
uploadSection.addEventListener('dragleave', handleDragLeave);
uploadSection.addEventListener('drop', handleFileDrop);
selectBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileInput);
replaceBtnInProgress.addEventListener('click', resetUploadForm);
descriptionInput.addEventListener('input', updatePreviewText);
// フォーム送信処理を統一
// フォームのデフォルト送信を防止し、JavaScriptで制御する
const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
  uploadForm.addEventListener('submit', async function(e) {
    console.log('=== フォーム送信イベントが発生しました ===');
    e.preventDefault(); // デフォルト送信を防止
    
    // アップロードファイルチェック
    console.log('アップロードファイルチェック:', uploadedFile ? 'あり' : 'なし');
    if (!uploadedFile) {
      alert('動画ファイルがありません');
      return;
    }
    
    // 説明文からタグと文章を分離してヒドゥンフィールドにセット
    const inputText = descriptionInput.value.trim();
    console.log('=== 投稿処理デバッグ ===');
    console.log('入力されたテキスト:', inputText);
    
    const { description, tags } = parseDescriptionAndTags(inputText);
    
    console.log('分離結果 - 説明文:', description);
    console.log('分離結果 - タグ:', tags);
    console.log('タグ数:', tags.length);
    
    const hiddenDescription = document.getElementById('hiddenDescription');
    const hiddenTags = document.getElementById('hiddenTags');
    
    if (hiddenDescription) {
      hiddenDescription.value = description;
      console.log('hiddenDescriptionに設定:', hiddenDescription.value);
    } else {
      console.error('hiddenDescription要素が見つかりません');
    }
    
    if (hiddenTags) {
      hiddenTags.value = tags.join(',');
      console.log('hiddenTagsに設定:', hiddenTags.value);
    } else {
      console.error('hiddenTags要素が見つかりません');
    }
    
    // フォームデータを取得して送信
    submitBtn.disabled = true;
    submitBtn.textContent = '投稿中...';
    
    try {
      const formData = new FormData(uploadForm);
      
      // ファイルを追加
      if (uploadedFile) {
        formData.set('videoFile', uploadedFile);
      }
      
      const response = await fetch('/shortclips', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        window.location.href = '/shortclips?created=1';
      } else {
        throw new Error('投稿に失敗しました');
      }
    } catch (error) {
      console.error('投稿エラー:', error);
      alert('投稿に失敗しました。もう一度お試しください。');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '切り抜きを投稿する';
    }
  });
}

// 投稿処理はフォーム送信イベントで完結しています

function handleDragOver(e) {
  e.preventDefault();
  uploadSection.classList.add('dragover');
}

function handleDragLeave() {
  uploadSection.classList.remove('dragover');
}

function handleFileDrop(e) {
  e.preventDefault();
  uploadSection.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files.length) {
    handleFileSelected(e.dataTransfer.files[0]);
  }
}

function handleFileInput(e) {
  if (e.target.files && e.target.files.length) {
    handleFileSelected(e.target.files[0]);
  }
}

function resetUploadForm() {
  postContainer.style.display = 'none';
  progressArea.style.display = 'none';
  progressBar.style.width = '0%';
  uploadedInfo.textContent = '';
  uploadSection.style.display = 'block';
  fileInput.value = '';
  uploadedFile = null;
  workSelectionBlock.style.display = 'none';
  descriptionInput.value = '';
  previewText.textContent = '';
}

function updatePreviewText() {
  previewText.textContent = descriptionInput.value;
}

function handleFileSelected(file) {
  
  uploadedFile = file;

  uploadSection.style.display = 'none';
  progressArea.style.display = 'block';
  postContainer.style.display = 'flex';

  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
  uploadedInfo.textContent = `${file.name} (${sizeMB}MB) - アップロード中...`;

  simulateProgress(file, sizeMB);
  setupVideoPreview(file);
}

function simulateProgress(file, sizeMB) {
  
  progressBar.style.width = '0%';
  let loaded = 0;
  const total = file.size;
  const interval = setInterval(() => {
    loaded += total / 50;
    const percent = Math.min((loaded / total) * 100, 100);
    progressBar.style.width = percent + '%';
    if (percent >= 100) {
      clearInterval(interval);
      uploadedInfo.textContent = `${file.name} (${sizeMB}MB) - アップロード完了`;
      // ポップアップを自動表示しないように修正
      // workSelectionBlock.style.display = 'block';
      document.getElementById('submitButtonContainer').style.display = 'block';
    }
  }, 100);
}

function setupVideoPreview(file) {
  const videoURL = URL.createObjectURL(file);
  previewVideo.src = videoURL;

  previewVideo.addEventListener('loadedmetadata', () => {
    const vw = previewVideo.videoWidth;
    const vh = previewVideo.videoHeight;

    if (!vw || !vh) return;

    const aspect = vw / vh;

    if (aspect > 1) {
      previewVideo.style.width = '100%';
      previewVideo.style.height = 'auto';
    } else {
      previewVideo.style.width = 'auto';
      previewVideo.style.height = '100%';
    }

    previewVideo.style.position = 'absolute';
    previewVideo.style.top = '50%';
    previewVideo.style.left = '50%';
    previewVideo.style.transform = 'translate(-50%, -50%)';
  });

  previewVideo.addEventListener('click', () => {
    if (previewVideo.paused) {
      previewVideo.play();
    } else {
      previewVideo.pause();
    }
  });
}

// =============================
// (2) 作品検索処理
// =============================
workSearchBtn.addEventListener('click', async () => {
  const searchQuery = workSearchInput.value.trim();
  
  // 検索クエリが空の場合、自分の作品を全て表示
  if (searchQuery === '') {
    fetchAndDisplayMyWorks();
    return;
  }
  
  try {
    // 検索APIを利用して作品を検索
    const response = await fetch(`/api/works?q=${encodeURIComponent(searchQuery)}`);
    if (!response.ok) {
      throw new Error('検索に失敗しました');
    }
    
    const searchResults = await response.json();
    
    // 検索結果がない場合、保存してある自分の作品を表示
    if (searchResults.length === 0) {
      workList.innerHTML = '<p style="text-align: center; padding: 10px; margin-bottom: 20px;">"' + searchQuery + '"と一致する作品は見つかりませんでした。あなたの有料作品を表示します。</p>';
      
      // 保存された自分の作品があれば表示
      if (window.myPaidWorks && window.myPaidWorks.length > 0) {
        renderWorkCards(window.myPaidWorks);
      } else {
        // 保存された作品がなければ改めて読み込む
        fetchAndDisplayMyWorks();
      }
      
    } else {
      // API で既に有料作品のみ取得済み
      if (searchResults.length === 0) {
        workList.innerHTML = '<p style="text-align: center; padding: 10px; margin-bottom: 20px;">"' + searchQuery + '"に一致する有料作品はありません。あなたの有料作品を表示します。</p>';
        // 保存された自分の作品を表示
        if (window.myPaidWorks && window.myPaidWorks.length > 0) {
          renderWorkCards(window.myPaidWorks);
        } else {
          fetchAndDisplayMyWorks();
        }
      } else {
        renderWorkCards(searchResults);
      }
    }
    
  } catch (error) {
    console.error('検索エラー:', error);
    workList.innerHTML = '<p style="text-align: center; padding: 10px;">エラーが発生しました: ' + error.message + '</p>';
    // エラー時も自分の作品を表示
    setTimeout(() => {
      if (window.myPaidWorks && window.myPaidWorks.length > 0) {
        renderWorkCards(window.myPaidWorks);
      } else {
        fetchAndDisplayMyWorks();
      }
    }, 2000); // 2秒後に自動的に自分の作品を表示
  }
});

function renderWorkCards(worksData) {
  workList.innerHTML = '';
  confirmWorkBtn.disabled = true;
  selectWorkButtonArea.style.display = 'none';

  if (!worksData || worksData.length === 0) {
    workList.innerHTML = '<p style="text-align: center; margin-top: 20px;">該当作品がありません</p>';
    return;
  }

  worksData.forEach(w => {
    const card = document.createElement('div');
    card.classList.add('work-card');
    const thumb = w.thumbnailUrl || '/img/no_thumbnail.png';
    
    // 作品情報をより詳細に表示
    let tagsHTML = '';
    card.innerHTML = `
      <img src="${thumb}" class="work-card-thumb" alt="${w.title}">
      <div class="work-card-info">
        <h4>${w.title}</h4>
      </div>
    `;
    
    card.addEventListener('click', () => {
      document.querySelectorAll('.work-card.selected')
              .forEach(el => el.classList.remove('selected'));
      card.classList.add('selected');
      selectedWorkId = w._id;
      selectedWorkTitleText = w.title;
      confirmWorkBtn.disabled = false;
    });
    
    workList.appendChild(card);
  });

  selectWorkButtonArea.style.display = 'block';
}

// =============================
// (3) 作品確定モーダル
// =============================
confirmWorkBtn.addEventListener('click', () => {
  
  if (!selectedWorkId) return;
  selectedWorkTitle.textContent = `『${selectedWorkTitleText}』が選択されました`;
  episodeConfirmModal.style.display = 'flex';
});

goAddEpisodeBtn.addEventListener('click', () => {
  
  episodeConfirmModal.style.display = 'none';
  openEpisodeSelect();
});

skipEpisodeBtn.addEventListener('click', () => {
  
  episodeConfirmModal.style.display = 'none';
  finalizeSelection();
});

// =============================
// (4) エピソード選択処理
// =============================
async function openEpisodeSelect() {
  try {
    episodeList.innerHTML = '<p style="text-align: center; margin-top: 20px;">読み込み中...</p>';
    
    const res = await fetch(`/api/works/${selectedWorkId}/episodes`);
    if (!res.ok) throw new Error('エピソード取得に失敗');
    const eps = await res.json();
    
    // 有料コンテンツのみにフィルタリング
    const paidEpisodes = eps.filter(episode => {
      // isPaidがフィールドに存在する場合はそれを使用、存在しない場合は全て表示
      return episode.isPaid === undefined || episode.isPaid === true;
    });
    
    renderEpisodeCards(paidEpisodes);
    episodeSelectModal.style.display = 'flex';
    // 外側クリックで閉じる
    episodeSelectModal.addEventListener('click', function modalOuter(e) {
      if (e.target === episodeSelectModal) {
        episodeSelectModal.style.display = 'none';
        episodeSelectModal.removeEventListener('click', modalOuter);
      }
    });
  } catch (err) {
    alert('エピソードを取得できませんでした');
    console.error(err);
    episodeList.innerHTML = '<p style="text-align: center; margin-top: 20px;">エピソードの読み込みに失敗しました</p>';
  }
}

function renderEpisodeCards(eps) {
  episodeList.innerHTML = '';
  decideEpisodeBtn.disabled = true;

  if (!eps || eps.length === 0) {
    episodeList.innerHTML = '<p style="text-align: center; margin-top: 20px;">エピソードがありません</p>';
    return;
  }

  eps.forEach(ep => {
    const card = document.createElement('div');
    card.classList.add('episode-card');
    const epThumb = ep.thumbnailUrl || '/img/no_thumbnail.png';
    
    // エピソード情報を整理
    const duration = ep.duration ? ep.duration : '';
    const price = ep.isPaid && ep.price ? `${ep.price}円` : '無料';
    
    card.innerHTML = `
      <img src="${epThumb}" class="ep-thumb" alt="${ep.title}">
      <div class="ep-info">
        <h4 class="ep-title">${ep.title}</h4>
        <p class="ep-desc">${ep.description || '説明なし'}</p>
        <div class="ep-meta">
          <span class="ep-duration">${duration}</span>
          <span class="ep-price">${price}</span>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => {
      // 既存の選択を解除
      document.querySelectorAll('.episode-card')
              .forEach(el => {
                el.classList.remove('selected');
                el.style.border = '1px solid #ddd';
              });
              
      // 新しい選択を適用
      card.classList.add('selected');
      card.style.border = '3px solid #0078d7';
      card.style.boxShadow = '0 0 12px rgba(0,120,215,0.7)';
      
      selectedEpisodeId = ep._id;
      selectedEpisodeTitle = ep.title;
      decideEpisodeBtn.disabled = false;
      
      // コンソールログで選択状態を確認
      console.log('エピソード選択:', ep.title, card.classList.contains('selected'));
    });
    
    episodeList.appendChild(card);
  });
}

decideEpisodeBtn.addEventListener('click', () => {
  
  episodeSelectModal.style.display = 'none';
  finalizeSelection();
});

// =============================
// (5) 選択完了処理
// =============================
function finalizeSelection() {
  // 検索フォームを非表示
  workSelectionBlock.style.display = 'none';
  
  // モーダルも全て非表示に
  if (episodeSelectModal) {
    episodeSelectModal.style.display = 'none';
  }
  
  // オーバーレイを非表示にし、スクロールを有効に
  workSectionOverlay.style.display = 'none';
  document.body.style.overflow = 'auto';

  // 選択された作品とエピソードを表示
  let msg = `作品「${selectedWorkTitleText}」`;
  if (selectedEpisodeTitle) {
    msg += `のエピソード「${selectedEpisodeTitle}」`;
  } else {
    msg += `（エピソード未選択）`;
  }
  msg += 'が選択されています。';

  selectedStatusText.textContent = msg; // 選択内容を表示
  selectedContainer.style.display = 'block'; // 選択完了UIを表示
  
  // リード先検索ボタンの下に表示されるようにスクロール
  selectedContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // hidden inputに値をセット
  const hiddenWorkId = document.getElementById('hiddenWorkId');
  const hiddenWorkTitle = document.getElementById('hiddenWorkTitle');
  const hiddenEpisodeId = document.getElementById('hiddenEpisodeId');
  const hiddenEpisodeTitle = document.getElementById('hiddenEpisodeTitle');
  
  if (hiddenWorkId) hiddenWorkId.value = selectedWorkId || '';
  if (hiddenWorkTitle) hiddenWorkTitle.value = selectedWorkTitleText;
  if (hiddenEpisodeId) hiddenEpisodeId.value = selectedEpisodeId || '';
  if (hiddenEpisodeTitle) hiddenEpisodeTitle.value = selectedEpisodeTitle;
}

// 「選択し直す」ボタンのイベントリスナー
rechooseBtn.addEventListener('click', () => {
  
  // 選択状態をリセット
  selectedWorkId = null;
  selectedWorkTitleText = '';
  selectedEpisodeId = null;
  selectedEpisodeTitle = '';

  // 選択完了UIを非表示
  selectedContainer.style.display = 'none';

  // 検索フォームを再表示
  workSelectionBlock.style.display = 'block';

  // 作品一覧をクリア
  workList.innerHTML = '';
  confirmWorkBtn.disabled = true;
});