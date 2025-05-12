document.addEventListener('DOMContentLoaded', () => {
  // 1) 「詳細を見る」ボタン// 分析パネルのトグル
  const analysisBtn = document.getElementById('toggleAnalysisBtn');
  const analysisPanel = document.getElementById('analysisPanel');
  if (analysisBtn && analysisPanel) {
    analysisBtn.addEventListener('click', () => {
      analysisPanel.classList.toggle('hidden');
    });
  }

  // 作品の詳細パネルのトグル
  const detailBtn = document.getElementById('toggleDetailBtn');
  const detailPanel = document.getElementById('workDetailPanel');
  if (detailBtn && detailPanel) {
    detailBtn.addEventListener('click', () => {
      detailPanel.classList.toggle('hidden');
      // ボタンの表示切り替え例
      if (detailPanel.classList.contains('hidden')) {
        detailBtn.textContent = '詳細を見る';
      } else {
        detailBtn.textContent = '詳細を閉じる';
      }
    });
  }

  // 2) 「詳細を見る」ボタンのトグル
  const detailAreaBtn  = document.getElementById('toggleDetailAreaBtn');
  const detailArea = document.getElementById('detailArea');
  
  if (detailAreaBtn && detailArea) {
    detailAreaBtn.addEventListener('click', () => {
      detailArea.classList.toggle('hidden');
      // ボタンの表示切り替え例
      if (detailArea.classList.contains('hidden')) {
        detailAreaBtn.textContent = '詳細を見る';
      } else {
        detailAreaBtn.textContent = '詳細を閉じる';
      }
    });
  }

  // 2) サムネイル画像 → 動画切り替え (ホバー再生)
  const cards = document.querySelectorAll('.work-card');
  cards.forEach(card => {
    const img = card.querySelector('.static-image');
    const vid = card.querySelector('.hover-video');
    if (!vid) return; // 動画が無い作品はスキップ

    card.addEventListener('mouseenter', () => {
      img.classList.add('hidden');
      vid.classList.remove('hidden');
      vid.currentTime = 0;
      vid.play();
    });
    card.addEventListener('mouseleave', () => {
      vid.pause();
      vid.currentTime = 0;
      vid.classList.add('hidden');
      img.classList.remove('hidden');
    });
  });

  // 3) エピソード説明欄の高さが変動した場合の「続きを見る」ボタンの表示/非表示を判定し直す
  function updateEpisodeToggleButtons() {
    document.querySelectorAll('.epcard-desc-wrapper').forEach(function(wrapper) {
      const descText = wrapper.querySelector('.epcard-desc-text');
      const toggleBtn = wrapper.querySelector('.epcard-toggle-desc');
      if (!descText || !toggleBtn) return;
      // 一旦展開状態を解除し、max-heightを元に戻す
      descText.classList.remove('expanded');
      toggleBtn.textContent = '---続きを見る---';
      // ボタンの表示判定
      if (descText.scrollHeight > descText.offsetHeight + 1) {
        toggleBtn.style.display = 'inline-block';
      } else {
        toggleBtn.style.display = 'none';
      }
    });
  }

  updateEpisodeToggleButtons();
  document.querySelectorAll('.epcard-desc-wrapper').forEach(function(wrapper) {
    const descText = wrapper.querySelector('.epcard-desc-text');
    const toggleBtn = wrapper.querySelector('.epcard-toggle-desc');
    if (!descText || !toggleBtn) return;
    toggleBtn.addEventListener('click', function() {
      const expanded = descText.classList.toggle('expanded');
      toggleBtn.textContent = expanded ? '---閉じる---' : '---続きを見る---';
      if (!expanded) updateEpisodeToggleButtons();
    });
  });
});

window.addEventListener('resize', updateEpisodeToggleButtons);
