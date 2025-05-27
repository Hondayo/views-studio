// 共通のトグル処理関数
function setupToggleButton(btnId, panelId, iconId) {
  const btn = document.getElementById(btnId);
  const panel = document.getElementById(panelId);
  const icon = iconId ? document.getElementById(iconId) : null;
  if (btn && panel) {
    btn.addEventListener('click', () => {
      panel.classList.toggle('hidden');
      if (icon) {
        icon.style.transform = panel.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
      }
      if (panel.classList.contains('hidden')) {
        btn.textContent = '詳細を見る';
      } else {
        btn.textContent = '詳細を閉じる';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', function () {
  setupToggleButton('toggleDetailBtn', 'workDetailPanel', 'toggleDetailIcon');
  setupToggleButton('toggleAnalysisBtn', 'analysisPanel');
  setupToggleButton('toggleDetailAreaBtn', 'detailArea');

  // 作品カードのサムネイル画像 → 動画切り替え (ホバー再生)
  const workCards = document.querySelectorAll('.work-card');
  workCards.forEach(card => {
    const img = card.querySelector('.static-image');
    const vid = card.querySelector('.hover-video');
    if (!vid) return;

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
  
  // エピソードカードの動画再生を適切に制御
  const epCards = document.querySelectorAll('.epcard-card');
  epCards.forEach(card => {
    const video = card.querySelector('.epcard-video');
    if (!video) return;
    
    // ホバー時に動画再生
    card.addEventListener('mouseenter', () => {
      // ポーズ中の他の動画があれば停止する
      document.querySelectorAll('.epcard-video').forEach(v => {
        if (v !== video && !v.paused) {
          v.pause();
        }
      });
      
      // 現在の動画を再生
      if (video.paused) {
        video.play().catch(e => console.log('自動再生に失敗しました:', e));
      }
    });
    
    // ホバーが外れたら動画を一時停止
    card.addEventListener('mouseleave', () => {
      if (!video.paused) {
        video.pause();
      }
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
  window.addEventListener('resize', updateEpisodeToggleButtons);
});
