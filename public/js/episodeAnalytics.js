/**
 * エピソード分析のための初期化関数
 */
const _episodeAnalyticsImpl = (() => {
  // プライベート変数
  let currentPeriod = '7days';
  let analyticsData = {};
  let episodeId;
  let workId;
  
  /**
   * タブ切り替え機能の初期化
   */
  const setupTabs = () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-pane');
    
    if (tabButtons.length === 0 || tabContents.length === 0) {
      console.warn('タブ要素が見つかりません');
      return;
    }
    
    // 既存のイベントリスナーを削除してから追加
    tabButtons.forEach(button => {
      button.removeEventListener('click', tabClickHandler);
      button.addEventListener('click', tabClickHandler);
    });
    
    // 初期状態では最初のタブをアクティブにする
    if (!document.querySelector('.tab-btn.active')) {
      const firstButton = tabButtons[0];
      firstButton.classList.add('active');
      
      // 対応するコンテンツもアクティブに
      const firstTabId = firstButton.dataset.tab;
      const firstContent = document.getElementById(firstTabId);
      if (firstContent) {
        firstContent.classList.add('active');
      }
    }
    
    // タブクリックハンドラー関数
    function tabClickHandler(event) {
      const clickedButton = event.currentTarget;
      const tabId = clickedButton.dataset.tab;
      
      // アクティブなタブを更新
      tabButtons.forEach(btn => btn.classList.remove('active'));
      clickedButton.classList.add('active');
      
      // コンテンツを切り替え
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId) {
          content.classList.add('active');
        }
      });
    }
  };
  
  /**
   * 期間関連の設定
   * 注：期間選択ボタンは削除されたため、デフォルト期間を設定
   */
  const setupPeriod = () => {
    // デフォルト期間を7日間に設定
    currentPeriod = '7days';
  };
  
  /**
   * エピソード選択機能の設定
   */
  const setupEpisodeSelector = () => {
    const episodeSelector = document.getElementById('episodeSelector');
    if (episodeSelector) {
      episodeSelector.addEventListener('change', () => {
        const selectedEpisodeId = episodeSelector.value;
        // 選択したエピソードのページへリダイレクト
        window.location.href = `/works/${workId}/episodes/${selectedEpisodeId}/analyze`;
      });
    }
  };
  
  /**
   * 横棒グラフでの流入経路の表示
   */
  const renderReachSourcesChart = (sourcesData) => {
    const container = document.getElementById('reachSourcesChart');
    if (!container) return;
    
    // コンテナをクリア
    container.innerHTML = '';
    
    // データがない場合
    if (!sourcesData || Object.keys(sourcesData).length === 0) {
      container.innerHTML = '<div class="empty-state">データがありません</div>';
      return;
    }
    
    // 合計値を計算して、百分率を算出
    const total = Object.values(sourcesData).reduce((sum, value) => sum + value, 0);
    
    // ソースラベルの定義
    const sourceLabels = {
      'clips': '切り抜き',
      'search': '検索',
      'browsing': 'ブラウジング',
      'related': '関連作品',
      'others': 'その他'
    };
    
    // バーの色を定義
    const barColors = {
      'clips': 'linear-gradient(to right, #0088ff, #00a0ff)',
      'search': 'linear-gradient(to right, #ff8800, #ffa500)',
      'browsing': 'linear-gradient(to right, #00cc88, #00e699)',
      'related': 'linear-gradient(to right, #9966ff, #aa80ff)',
      'others': 'linear-gradient(to right, #ff6666, #ff8080)'
    };
    
    // 降順でデータをソート
    const sortedSources = Object.entries(sourcesData)
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => {
        const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
        return { source, count, percentage };
      });
    
    // タイトルはEJSファイルで提供されているため、ここでは追加しない
    
    // ソースごとに横棒グラフ要素を作成
    sortedSources.forEach(({ source, count, percentage }) => {
      const sourceLabel = sourceLabels[source] || source;
      
      // 横棒グラフのアイテムコンテナを作成
      const barItem = document.createElement('div');
      barItem.className = 'horizontal-bar-item';
      
      // ソースラベルを作成
      const label = document.createElement('div');
      label.className = 'source-label';
      label.textContent = sourceLabel;
      barItem.appendChild(label);
      
      // トラック(棒グラフの背景)を作成
      const track = document.createElement('div');
      track.className = 'horizontal-bar-track';
      
      // 実際の棒部分を作成
      const fill = document.createElement('div');
      fill.className = 'horizontal-bar-fill';
      fill.style.width = `${percentage}%`;
      fill.style.background = barColors[source] || barColors['others'];
      
      // パーセンテージラベルを作成
      const percentageLabel = document.createElement('div');
      percentageLabel.className = 'percentage-label';
      percentageLabel.textContent = `${percentage}% (${count.toLocaleString()})`;
      
      // 要素を組み立てる
      track.appendChild(fill);
      track.appendChild(percentageLabel);
      barItem.appendChild(track);
      container.appendChild(barItem);
    });
  };
  

  
  /**
   * 秒数を時間形式（MM:SS）に変換
   */
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  /**
   * 視聴者流入経路のデータを取得する
   */
  const fetchReachSourcesData = (period) => {
    // 実際の実装では、ここでAPIリクエストを送信してデータを取得
    // ここではダミーデータを返します
    return new Promise((resolve) => {
      // サーバーからのレスポンスをシミュレート
      setTimeout(() => {
        try {
          // 期間に応じてデータを調整
          let multiplier = 1;
          if (period === '30days') multiplier = 4;
          if (period === '90days') multiplier = 12;
          
          // データ生成用ヘルパー関数
          const generateData = (base) => Math.floor(base * (0.7 + Math.random() * 0.6));
          
          // 中身のあるデータを返す
          resolve({
            'clips': generateData(40),
            'search': generateData(25),
            'browsing': generateData(15),
            'related': generateData(10),
            'others': generateData(10)
          });
        } catch (e) {
          // もし何かエラーが発生しても空のデータを返す
          console.error('データ生成中にエラーが発生しました:', e);
          resolve({});
        }
      }, 300);
    });
  };
  
  /**
   * 切り抜きのリード貢献度データを取得する
   * @param {string} period - 分析期間
   * @return {Promise} - 切り抜きデータのPromise
   */
  const fetchClipsContributionData = (period) => {
    return new Promise((resolve, reject) => {
      // データ取得処理（実際の実装ではAPIリクエストになる）
      setTimeout(() => {
        try {
          // ファネルデータ（視聴数→作品ページ閲覧→課金のステップ）
          const funnelData = {
            views: 1000 + Math.floor(Math.random() * 500),
            pageVisits: 350 + Math.floor(Math.random() * 150),
            purchases: 50 + Math.floor(Math.random() * 30)
          };
          
          // 切り抜きごとのデータ（モックデータ）
          const clipsCount = 20; // 実際のデータ数
          const clipsData = [];
          
          // クリップタイトルのサンプル
          const sampleTitles = [
            '【重要シーン】主人公が初めて能力に目覚めるシーン',
            '【感動】涙なしでは見られない最終回の名シーン',
            '【爆笑】思わず笑ってしまう名場面集',
            '【考察】この伏線に気づいた？重要な暗示シーン',
            '【名シーン】ファンが選ぶベストバトル',
            '【衝撃】予想外の展開に驚愕する視聴者',
            '【まとめ】これだけ見ればわかるストーリー',
            '【切り抜き】登場人物の魅力がわかるシーン集',
            '【解説】作品の世界観を5分で理解',
            '【必見】作者が語る制作秘話と裏設定',
          ];
          
          for (let i = 0; i < clipsCount; i++) {
            // タイトルはサンプルからランダムに選択（重複あり）またはインデックスを追加
            const titleIndex = Math.floor(Math.random() * sampleTitles.length);
            const title = i < sampleTitles.length 
              ? sampleTitles[i] 
              : `${sampleTitles[titleIndex]} パート${i - sampleTitles.length + 1}`;
              
            // 各指標の生成（ランダム）
            const views = 50 + Math.floor(Math.random() * 950);
            const pageVisits = Math.floor(views * (0.1 + Math.random() * 0.4));
            const purchases = Math.floor(pageVisits * (0.05 + Math.random() * 0.2));
            const cvr = (purchases / views * 100).toFixed(2);
            
            clipsData.push({
              id: `clip-${i}`,
              title,
              views,
              pageVisits,
              purchases,
              cvr
            });
          }
          
          // データを視聴数の降順でソート
          clipsData.sort((a, b) => b.views - a.views);
          
          resolve({
            funnel: funnelData,
            clips: clipsData
          });
        } catch (e) {
          console.error('切り抜きデータ生成中にエラーが発生しました:', e);
          resolve({
            funnel: { views: 0, pageVisits: 0, purchases: 0 },
            clips: []
          });
        }
      }, 300);
    });
  };
  

  
  /**
   * リード獲得ファネルチャートを表示する
   * @param {Object} funnelData - ファネルのデータ
   */
  const renderLeadFunnelChart = (funnelData) => {
    const container = document.getElementById('leadFunnelChart');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!funnelData || funnelData.views === 0) {
      container.innerHTML = '<div class="empty-state">データがありません</div>';
      return;
    }
    
    // ファネルチャートを描画する
    const { views, pageVisits, purchases } = funnelData;
    
    // 各段階のデータを作成
    const steps = [
      { name: '切り抜き視聴数', value: views, percentage: 100 },
      { name: '作品ページ訪問', value: pageVisits, percentage: (pageVisits / views * 100).toFixed(1) },
      { name: '課金完了', value: purchases, percentage: (purchases / views * 100).toFixed(1) }
    ];
    
    // 各ステップの要素を作成
    steps.forEach((step, index) => {
      const stepElement = document.createElement('div');
      stepElement.className = 'funnel-step';
      
      const fillElement = document.createElement('div');
      fillElement.className = 'funnel-step-fill';
      fillElement.style.width = `${step.percentage}%`;
      
      const textElement = document.createElement('div');
      textElement.className = 'funnel-step-text';
      textElement.textContent = `${step.name}: ${step.value.toLocaleString()} (${step.percentage}%)`;
      
      stepElement.appendChild(fillElement);
      stepElement.appendChild(textElement);
      container.appendChild(stepElement);
    });
  };
  
  /**
   * トップ5の切り抜き表示をレンダリング
   * @param {Array} clipsData - 切り抜きデータの配列
   */
  const renderTopClipsTable = (clipsData) => {
    const tableBody = document.getElementById('topClipsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!clipsData || clipsData.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5">データがありません</td></tr>';
      return;
    }
    
    // 上位5件だけ表示
    const topClips = clipsData.slice(0, 5);
    
    topClips.forEach(clip => {
      const row = document.createElement('tr');
      
      // タイトル
      const titleCell = document.createElement('td');
      titleCell.textContent = clip.title;
      row.appendChild(titleCell);
      
      // 視聴数
      const viewsCell = document.createElement('td');
      viewsCell.className = 'stage-views';
      viewsCell.textContent = clip.views.toLocaleString();
      row.appendChild(viewsCell);
      
      // 作品ページ訪問数
      const pageVisitsCell = document.createElement('td');
      pageVisitsCell.className = 'stage-page-visit';
      pageVisitsCell.textContent = clip.pageVisits.toLocaleString();
      row.appendChild(pageVisitsCell);
      
      // 課金数
      const purchasesCell = document.createElement('td');
      purchasesCell.className = 'stage-purchase';
      purchasesCell.textContent = clip.purchases.toLocaleString();
      row.appendChild(purchasesCell);
      
      // コンバージョン率
      const cvrCell = document.createElement('td');
      cvrCell.textContent = `${clip.cvr}%`;
      row.appendChild(cvrCell);
      
      tableBody.appendChild(row);
    });
  };

  /**
   * すべての切り抜きデータをモーダルに表示
   * @param {Array} clipsData - 切り抜きデータの配列
   */
  const renderAllClipsTable = (clipsData) => {
    const tableBody = document.getElementById('allClipsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!clipsData || clipsData.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5">データがありません</td></tr>';
      return;
    }
    
    // 全てのデータを表示
    clipsData.forEach(clip => {
      const row = document.createElement('tr');
      
      // タイトル
      const titleCell = document.createElement('td');
      titleCell.textContent = clip.title;
      row.appendChild(titleCell);
      
      // 視聴数
      const viewsCell = document.createElement('td');
      viewsCell.className = 'stage-views';
      viewsCell.textContent = clip.views.toLocaleString();
      row.appendChild(viewsCell);
      
      // 作品ページ訪問数
      const pageVisitsCell = document.createElement('td');
      pageVisitsCell.className = 'stage-page-visit';
      pageVisitsCell.textContent = clip.pageVisits.toLocaleString();
      row.appendChild(pageVisitsCell);
      
      // 課金数
      const purchasesCell = document.createElement('td');
      purchasesCell.className = 'stage-purchase';
      purchasesCell.textContent = clip.purchases.toLocaleString();
      row.appendChild(purchasesCell);
      
      // コンバージョン率
      const cvrCell = document.createElement('td');
      cvrCell.textContent = `${clip.cvr}%`;
      row.appendChild(cvrCell);
      
      tableBody.appendChild(row);
    });
  };
  
  /**
   * 切り抜き詳細モーダルの設定
   * @param {Array} clipsData - 切り抜きデータの配列
   */
  const setupClipsModal = (clipsData) => {
    if (!clipsData) return;
    
    const modal = document.getElementById('clipsDetailModal');
    const showAllBtn = document.getElementById('showAllClipsBtn');
    const closeBtn = modal?.querySelector('.close-modal');
    const filterInput = document.getElementById('clipsFilter');
    const sortSelect = document.getElementById('clipsSort');
    
    if (!modal || !showAllBtn || !closeBtn) return;
    
    // 全ての切り抜き表示ボタンの設定
    showAllBtn.addEventListener('click', () => {
      modal.style.display = 'block';
      renderAllClipsTable(clipsData);
    });
    
    // 閉じるボタンの設定
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    // モーダル外クリックで閉じる
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
    
    // フィルター機能の設定
    if (filterInput) {
      filterInput.addEventListener('input', () => {
        const filterValue = filterInput.value.toLowerCase();
        const filteredData = clipsData.filter(clip => 
          clip.title.toLowerCase().includes(filterValue)
        );
        
        // 現在のソート順を維持してフィルタリングしたデータを表示
        const sortValue = sortSelect?.value || 'views';
        sortClipsData(filteredData, sortValue);
        renderAllClipsTable(filteredData);
      });
    }
    
    // ソート機能の設定
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        const sortValue = sortSelect.value;
        const filterValue = filterInput?.value?.toLowerCase() || '';
        
        // 現在のフィルターを適用したデータをソート
        let dataToSort = clipsData;
        if (filterValue) {
          dataToSort = clipsData.filter(clip => 
            clip.title.toLowerCase().includes(filterValue)
          );
        }
        
        sortClipsData(dataToSort, sortValue);
        renderAllClipsTable(dataToSort);
      });
    }
    
    // データのソート用ヘルパー関数
    function sortClipsData(data, sortBy) {
      switch(sortBy) {
        case 'views':
          data.sort((a, b) => b.views - a.views);
          break;
        case 'conversion':
          data.sort((a, b) => parseFloat(b.cvr) - parseFloat(a.cvr));
          break;
        case 'purchase':
          data.sort((a, b) => b.purchases - a.purchases);
          break;
        default:
          data.sort((a, b) => b.views - a.views);
      }
    }
  };

  /**
   * 全ての分析データの表示を更新
   */
  const updateAnalyticsDisplays = async () => {
    try {
      // 視聴者流入経路のデータを取得して表示
      const reachSourcesData = await fetchReachSourcesData(currentPeriod);
      if (reachSourcesData && Object.keys(reachSourcesData).length > 0) {
        renderReachSourcesChart(reachSourcesData);
      }
      
      // 切り抜きリード貢献度データを取得して表示
      const clipsContributionData = await fetchClipsContributionData(currentPeriod);
      if (clipsContributionData) {
        if (clipsContributionData.funnel) {
          renderLeadFunnelChart(clipsContributionData.funnel);
        }
        
        if (clipsContributionData.clips && clipsContributionData.clips.length > 0) {
          renderTopClipsTable(clipsContributionData.clips);
          setupClipsModal(clipsContributionData.clips); // モーダルの設定
        }
      }
      
      // データが無い場合はデフォルトメッセージを表示
      if ((!reachSourcesData || Object.keys(reachSourcesData).length === 0) && 
          (!clipsContributionData || !clipsContributionData.clips || clipsContributionData.clips.length === 0)) {
        const sections = document.querySelectorAll('.analytics-section');
        sections.forEach(section => {
          if (section.innerHTML.trim() === '') {
            section.innerHTML = '<div class="info-message">データはまだ利用できません。しばらくしてから再度お試しください。</div>';
          }
        });
      }
      
      // 他の関数が存在する場合は実行
      try {
        if (typeof updateViewersCharts === 'function') {
          updateViewersCharts(currentPeriod);
        }
        
        if (typeof updateMonetizationCharts === 'function') {
          updateMonetizationCharts(currentPeriod);
        }
      } catch (innerError) {
        console.warn('チャート更新中にエラー発生:', innerError);
      }
      
    } catch (error) {
      console.error('データの更新中にエラーが発生しました:', error);
      // エラーメッセージを表示
      const errorContainers = document.querySelectorAll('.analytics-section');
      errorContainers.forEach(container => {
        if (!container.querySelector('.error-message')) {
          container.innerHTML = '<div class="error-message">データの読み込み中にエラーが発生しました。再度お試しください。</div>';
        }
      });
    }
  };
  
  /**
   * 分析システムの初期化
   */
  const initialize = (data) => {
    try {
      // データを保存
      analyticsData = data || {};
      
      // IDを取得
      episodeId = document.getElementById('episodeId')?.value;
      workId = document.getElementById('workId')?.value;
      
      // UIコンポーネントの設定
      // DOM要素が確実に利用可能な状態で実行
      requestAnimationFrame(() => {
        // タブのセットアップ
        setupTabs();
        
        // 期間の初期設定
        setupPeriod();
        
        // エピソード選択機能の設定
        setupEpisodeSelector();
        
        // 初期データの表示
        setTimeout(() => {
          updateAnalyticsDisplays();
        }, 100);
      });
      
      // レスポンシブ対応
      window.addEventListener('resize', () => {
        // リサイズ時の再レンダリングはデバウンスして負荷軽減
        if (window.resizeTimer) {
          clearTimeout(window.resizeTimer);
        }
        window.resizeTimer = setTimeout(() => {
          updateAnalyticsDisplays();
        }, 250);
      });
      
      return true;
    } catch (error) {
      console.error('初期化中にエラーが発生しました:', error);
      return false;
    }
  };
  
  // 公開インターフェース
  return {
    initialize,
    setupTabs,
    setupPeriod,
    setupEpisodeSelector,
    updateAnalyticsDisplays
  };
})();

// 外部インターフェースの公開
const initEpisodeAnalytics = (data) => {
  // DOMが完全に読み込まれたことを確認
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      return _episodeAnalyticsImpl.initialize(data);
    });
  } else {
    // DOMはすでに読み込まれている
    return _episodeAnalyticsImpl.initialize(data);
  }
};
