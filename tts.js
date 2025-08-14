class TTSManager {
  constructor() {
    // VOICES 배열 (audiobook-ui에서 가져옴)
    this.VOICES = [
      { name: '루시안 프로이드', id: 'hQqi26RFdZ59x3bGR2Bnoj', key: '1' },
      { name: '귀찮은 고양이', id: 'ad67887f07639d2973f48a', key: '2' },
      { name: '책뚫남', id: 'a213ca3c004c21da52d35d', key: '3' },
      { name: '제너레이션 MG', id: '4404f9613ff506ebd6daee', key: '4' },
      { name: '차분한 그녀', id: '26dbddbce9113c14a6822c', key: '5' },
      { name: '미술관 도슨트', id: '0f7ccb849f108608620302', key: '6' },
      { name: '박물관 사서', id: 'eb5e0f9308248300915305', key: '7' },
      { name: '진지한 케일리', id: 'weKbNjMh2V5MuXziwHwjoT', key: '8' },
      { name: 'Holy molly', id: '6151a25f6a7f5b1e000023', key: '9' },
      { name: '릭 루빈', id: 'nNkPFG9fioPzmsxGpawKbv', key: '0' }
    ];

    // 🎯 새로운 테이크 시스템 관련 상태
    this.preTakes = [];  // 사전 생성된 테이크 목록
    this.currentAudio = null;
    this.audioBuffer = {};
    this.takes = [];
    this.currentTakeIndex = 0;
    this.currentPlayingTakeId = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.isGenerating = false;
    this.bufferingTakes = new Set(); // 버퍼링 중인 테이크들
    this.abortController = null;
    
    // 현재 선택된 음성
    this.selectedVoice = this.VOICES[2]; // 기본값: 책뚫남
    
    // API URL
    this.apiUrl = 'https://quiet-ink-groq.vercel.app';
    
    // 플로팅 UI 요소들
    this.floatingUI = null;
    this.statusLabel = null;
    this.takeInfoLabel = null;
    this.wordInfoLabel = null;
    this.htmlViewer = null;
    
    // 단어 트래킹 관련 (App.js 스타일)
    this.currentTakeWordElements = [];
    this.currentTakeWords = [];
    
    // 🎯 페이지 로딩 완료 감지 및 초기화
    this.initializeWhenReady();
  }

  // 🎯 페이지 로딩 완료 시 초기화
  async initializeWhenReady() {
    // DOM이 완전히 로드될 때까지 대기
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeAfterLoad());
    } else if (document.readyState === 'interactive') {
      // DOMContentLoaded는 이미 발생했지만 리소스가 아직 로딩 중
      window.addEventListener('load', () => this.initializeAfterLoad());
    } else {
      // 이미 완전히 로드됨
      setTimeout(() => this.initializeAfterLoad(), 500);
    }
  }
  
  // 🎯 페이지 로딩 완료 후 초기화
  async initializeAfterLoad() {
    console.log('🎯 페이지 로딩 완료 - TTS 시스템 초기화 시작');
    
    this.createFloatingUI();
    this.setupKeyboardShortcuts();
    
    // 🎯 웹페이지 내용 분석 및 테이크 사전 생성
    await this.analyzePageAndCreateTakes();
    
    // UI를 항상 표시
    this.showUI();
    this.updateStatus('TTS 준비 완료 - 마우스를 올리고 1~0번 키를 누르세요', '#4CAF50');
    console.log('TTS Manager 초기화 완료');
  }
  
  // 🎯 웹페이지 분석 및 테이크 사전 생성
  async analyzePageAndCreateTakes() {
    console.log('🔍 웹페이지 분석 시작...');
    
    // body 내부 구조 파악 (header, footer 제외)
    const bodyContent = this.extractMainContent();
    
    // div, p 기준으로 텍스트 정보가 있는 요소들을 순차적으로 찾기
    const contentElements = this.findContentElements(bodyContent);
    
    console.log(`📄 발견된 콘텐츠 요소: ${contentElements.length}개`);
    
    // 각 요소를 테이크로 변환
    this.preTakes = [];
    for (let i = 0; i < contentElements.length; i++) {
      const element = contentElements[i];
      const text = this.extractTextFromElement(element);
      
      if (text && text.length > 10) { // 최소 길이 체크
        const takeId = `take-${i + 1}`;
        const language = await this.detectLanguage(text);
        
        const preTake = {
          id: takeId,
          index: i,
          text: text,
          language: language,
          element: element,
          selector: this.generateElementSelector(element),
          isBuffered: false,
          audioUrl: null
        };
        
        this.preTakes.push(preTake);
        console.log(`📝 테이크 ${i + 1} 생성: "${text.substring(0, 50)}..." (${language})`);
      }
    }
    
    console.log(`✅ 총 ${this.preTakes.length}개 테이크 사전 생성 완료`);
    this.updateTakeListUI();
  }
  
  // 🎯 body 내부 메인 콘텐츠 추출 (header, footer 제외)
  extractMainContent() {
    const body = document.body;
    if (!body) return null;
    
    // header, footer, nav 등 제외
    const excludeSelectors = [
      'header', 'footer', 'nav', '[role="banner"]', '[role="contentinfo"]',
      '[role="navigation"]', '.header', '.footer', '.nav', '.navigation',
      '.sidebar', '.menu', '.breadcrumb'
    ];
    
    // 메인 콘텐츠 영역 우선 찾기
    let mainContent = body.querySelector('main, [role="main"], .main, .content, .container');
    
    if (!mainContent) {
      // 메인 영역이 없으면 body 전체에서 제외 요소들 필터링
      mainContent = body;
    }
    
    console.log(`🎯 메인 콘텐츠 영역: <${mainContent.tagName.toLowerCase()}>`);
    return mainContent;
  }
  
  // 🎯 콘텐츠 요소들 찾기 (div, p 기준으로 순차적)
  findContentElements(container) {
    if (!container) return [];
    
    const contentElements = [];
    const processedElements = new Set(); // 중복 방지
    
    // TreeWalker로 모든 div, p 요소 순차 탐색
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          // 🎯 div, p, h# 태그 등 블록 요소만
          const validTags = ['div', 'p', 'article', 'section', 'blockquote', 'aside', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
          if (!validTags.includes(node.tagName.toLowerCase())) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // 제외 조건 확인
          if (this.shouldExcludeElement(node)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let currentNode;
    while (currentNode = walker.nextNode()) {
      // 이미 처리된 요소는 건너뛰기
      if (processedElements.has(currentNode)) {
        continue;
      }
      
      const tagName = currentNode.tagName.toLowerCase();
      console.log(`🔍 요소 검사: <${tagName}> (${currentNode.textContent?.length || 0}자)`);
      
      // 🎯 p 태그와 h# 태그는 우선적으로 처리 (직접 텍스트 여부와 관계없이)
      if (tagName === 'p' || tagName.match(/^h[1-6]$/)) {
        const fullText = this.extractAllTextFromElement(currentNode);
        if (fullText && fullText.length > 3) { // h# 태그는 더 짧아도 허용
          const elementType = tagName === 'p' ? 'P' : 'H';
          console.log(`✅ ${elementType} 태그 테이크 추가: "${fullText.substring(0, 30)}..."`);
          contentElements.push(currentNode);
          processedElements.add(currentNode);
        }
        continue;
      }
      
      // 🎯 div 등 다른 블록 요소 처리
      const directText = this.getDirectTextContent(currentNode);
      
      if (directText && directText.length > 10) {
        // 직접 텍스트가 있는 div 등
        console.log(`✅ 직접 텍스트 테이크 추가: <${tagName}> "${directText.substring(0, 30)}..."`);
        contentElements.push(currentNode);
        processedElements.add(currentNode);
        
        // 하위 p 태그들도 처리됨으로 표시 (중복 방지)
        const subParagraphs = currentNode.querySelectorAll('p');
        subParagraphs.forEach(p => processedElements.add(p));
      } else {
        // 직접 텍스트가 없으면 하위 p 태그들 개별 확인
        const subParagraphs = currentNode.querySelectorAll('p');
        for (const p of subParagraphs) {
          if (!processedElements.has(p) && !this.shouldExcludeElement(p)) {
            const fullText = this.extractAllTextFromElement(p);
            if (fullText && fullText.length > 10) {
              console.log(`✅ 하위 P 태그 테이크 추가: "${fullText.substring(0, 30)}..."`);
              contentElements.push(p);
              processedElements.add(p);
            }
          }
        }
      }
    }
    
    console.log(`🔍 콘텐츠 요소 탐색 완료: ${contentElements.length}개`);
    return contentElements;
  }
  
  // 🎯 요소 제외 여부 판단
  shouldExcludeElement(element) {
    // 기존 isExcludedElement 로직 재사용
    return this.isExcludedElement(element) || !this.isVisibleElement(element);
  }
  
  // 🎯 요소 가시성 확인
  isVisibleElement(element) {
    if (!element) return false;
    
    // 스타일 확인
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    
    // 크기 확인
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return false;
    }
    
    return true;
  }
  
  // 🎯 요소의 직접 텍스트 내용 추출 (하위 블록 요소 제외)
  getDirectTextContent(element) {
    let text = '';
    
    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        // 인라인 요소들(span, strong, em 등)의 텍스트는 포함
        const tagName = child.tagName.toLowerCase();
        const inlineTags = ['span', 'strong', 'em', 'b', 'i', 'a', 'code', 'small', 'sub', 'sup'];
        if (inlineTags.includes(tagName)) {
          text += child.textContent;
        }
      }
    }
    
    return text.trim();
  }
  
  // 🎯 요소에서 전체 텍스트 추출 (테이크 생성용)
  extractTextFromElement(element) {
    return this.extractAllTextFromElement(element);
  }
  
  // 🎯 요소 선택자 생성
  generateElementSelector(element) {
    let selector = element.tagName.toLowerCase();
    
    if (element.id) {
      selector += `#${element.id}`;
    } else if (element.className) {
      const classes = element.className.trim().split(/\s+/).slice(0, 2);
      selector += '.' + classes.join('.');
    }
    
    return selector;
  }
  
  // 🎯 테이크 목록 UI 업데이트
  updateTakeListUI() {
    if (this.htmlViewer) {
      let html = `<div style="color: #4CAF50; font-weight: bold; margin-bottom: 10px;">
        📋 발견된 테이크: ${this.preTakes.length}개
      </div>`;
      
      this.preTakes.slice(0, 5).forEach((take, index) => {
        const preview = take.text.substring(0, 40);
        const lang = take.language === 'ko' ? '🇰🇷' : '🇺🇸';
        html += `<div style="margin: 5px 0; font-size: 10px; opacity: 0.8;">
          ${index + 1}. ${lang} ${preview}...
        </div>`;
      });
      
      if (this.preTakes.length > 5) {
        html += `<div style="opacity: 0.6; font-size: 9px;">...그외 ${this.preTakes.length - 5}개</div>`;
      }
      
      this.htmlViewer.innerHTML = html;
    }
  }

  // 🎯 개선된 플로팅 UI 생성 (HTML 뷰어 포함)
  createFloatingUI() {
    // 기존 UI 제거
    const existingUI = document.getElementById('tts-floating-ui');
    if (existingUI) {
      existingUI.remove();
    }

    // 플로팅 컨테이너 생성 (CSS로 스타일링)
    this.floatingUI = document.createElement('div');
    this.floatingUI.id = 'tts-floating-ui';
    this.floatingUI.style.display = 'none'; // 초기 숨김

    // 🎯 상태 라벨
    this.statusLabel = document.createElement('div');
    this.statusLabel.id = 'tts-status';
    this.statusLabel.style.cssText = `
      margin-bottom: 8px;
      font-weight: bold;
      color: #4CAF50;
      font-size: 13px;
    `;
    this.statusLabel.textContent = 'TTS 준비됨';

    // 🎯 현재 음성 및 테이크 정보
    this.voiceLabel = document.createElement('div');
    this.voiceLabel.id = 'tts-voice';
    this.voiceLabel.style.cssText = `
      margin-bottom: 8px;
      color: #2196F3;
      font-size: 11px;
    `;
    this.voiceLabel.textContent = `음성: ${this.selectedVoice.name}`;

    // 🎯 현재 테이크 정보
    this.takeInfoLabel = document.createElement('div');
    this.takeInfoLabel.id = 'tts-take-info';
    this.takeInfoLabel.style.cssText = `
      margin-bottom: 8px;
      color: #FF9800;
      font-size: 11px;
    `;

    // 🎯 현재 단어 정보
    this.wordInfoLabel = document.createElement('div');
    this.wordInfoLabel.id = 'tts-word-info';
    this.wordInfoLabel.style.cssText = `
      margin-bottom: 8px;
      color: #9C27B0;
      font-size: 11px;
    `;

    // 🎯 진행률 바
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      margin-bottom: 10px;
      overflow: hidden;
    `;

    this.progressBar = document.createElement('div');
    this.progressBar.id = 'tts-progress';
    this.progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #4CAF50, #81C784);
      transition: width 0.3s ease;
      border-radius: 3px;
    `;

    progressContainer.appendChild(this.progressBar);

    // 🎯 HTML 코드 뷰어
    this.htmlViewer = document.createElement('div');
    this.htmlViewer.id = 'tts-html-viewer';
    this.htmlViewer.innerHTML = '<div style="color: #999;">HTML 코드가 여기에 표시됩니다</div>';

    // 🎯 단축키 안내
    const shortcutInfo = document.createElement('div');
    shortcutInfo.style.cssText = `
      font-size: 10px;
      color: rgba(255, 255, 255, 0.6);
      line-height: 1.3;
      margin-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 8px;
    `;
    shortcutInfo.innerHTML = `
      <div>🎵 1~0: 음성 선택 | ⏹️ ESC: 중지</div>
      <div>🔤 현재: ${this.selectedVoice.key}번 - ${this.selectedVoice.name}</div>
    `;

    // 🎯 요소들 조립
    this.floatingUI.appendChild(this.statusLabel);
    this.floatingUI.appendChild(this.voiceLabel);
    this.floatingUI.appendChild(this.takeInfoLabel);
    this.floatingUI.appendChild(this.wordInfoLabel);
    this.floatingUI.appendChild(progressContainer);
    this.floatingUI.appendChild(this.htmlViewer);
    this.floatingUI.appendChild(shortcutInfo);

    document.body.appendChild(this.floatingUI);
    
    console.log('🎯 TTS UI 생성 완료:', this.floatingUI);
  }

  // 🎯 새로운 키보드 단축키 설정 (마우스 위치 기반)
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // 입력 필드에서는 단축키 무시
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const key = event.key;

      // 🎯 1~0 숫자키로 마우스 위치의 테이크부터 재생 시작
      if (key >= '1' && key <= '9') {
        const voiceIndex = parseInt(key) - 1;
        if (voiceIndex < this.VOICES.length) {
          this.selectVoiceAndStartFromMousePosition(voiceIndex);
          event.preventDefault();
        }
      } else if (key === '0') {
        // 0번키는 마지막 음성
        this.selectVoiceAndStartFromMousePosition(9);
        event.preventDefault();
      } else if (key === 'Escape') {
        // ESC로 모든 재생 중지
        this.stopAll();
        event.preventDefault();
      }
    });
    
    // 🎯 마우스 움직임 추적
    this.currentMouseX = 0;
    this.currentMouseY = 0;
    
    document.addEventListener('mousemove', (event) => {
      this.currentMouseX = event.clientX;
      this.currentMouseY = event.clientY;
    });
  }
  
  // 🎯 음성 선택 후 마우스 위치에서 테이크 재생 시작
  async selectVoiceAndStartFromMousePosition(voiceIndex) {
    // 음성 선택
    if (voiceIndex >= 0 && voiceIndex < this.VOICES.length) {
      this.selectedVoice = this.VOICES[voiceIndex];
      console.log(`🎵 음성 선택: ${this.selectedVoice.name}`);
      
      // 🎯 마우스 위치에서 테이크 찾기
      const takeAtMouse = this.findTakeAtMousePosition();
      
      if (takeAtMouse) {
        console.log(`🎯 마우스 위치에서 테이크 발견: ${takeAtMouse.id}`);
        await this.startPlaybackFromTake(takeAtMouse);
      } else {
        console.log('🚫 마우스 위치에 테이크가 없습니다');
        this.updateStatus('마우스 위치에 재생할 콘텐츠가 없습니다', '#FF9800');
      }
    }
  }
  
  // 🎯 마우스 위치에서 테이크 찾기
  findTakeAtMousePosition() {
    if (!this.preTakes || this.preTakes.length === 0) {
      return null;
    }
    
    // 마우스 위치의 요소 찾기
    const elementAtMouse = document.elementFromPoint(this.currentMouseX, this.currentMouseY);
    
    if (!elementAtMouse) {
      return null;
    }
    
    console.log(`🔍 마우스 위치 요소: <${elementAtMouse.tagName.toLowerCase()}>`);
    
    // 해당 요소나 부모 요소가 테이크에 해당하는지 확인
    let currentElement = elementAtMouse;
    
    while (currentElement && currentElement !== document.body) {
      // 현재 요소가 테이크 요소인지 확인
      const foundTake = this.preTakes.find(take => take.element === currentElement);
      
      if (foundTake) {
        console.log(`✅ 테이크 발견: ${foundTake.id} (${foundTake.text.substring(0, 30)}...)`);
        return foundTake;
      }
      
      currentElement = currentElement.parentElement;
    }
    
    // 직접 매칭되지 않으면 가장 가까운 테이크 찾기
    return this.findClosestTake(elementAtMouse);
  }
  
  // 🎯 가장 가까운 테이크 찾기
  findClosestTake(targetElement) {
    if (!this.preTakes || this.preTakes.length === 0) {
      return null;
    }
    
    let closestTake = null;
    let minDistance = Infinity;
    
    for (const take of this.preTakes) {
      const distance = this.calculateElementDistance(targetElement, take.element);
      if (distance < minDistance) {
        minDistance = distance;
        closestTake = take;
      }
    }
    
    if (closestTake && minDistance < 1000) { // 1000px 이내만
      console.log(`📍 가장 가까운 테이크: ${closestTake.id} (거리: ${minDistance}px)`);
      return closestTake;
    }
    
    return null;
  }
  
  // 🎯 두 요소 간 거리 계산
  calculateElementDistance(element1, element2) {
    const rect1 = element1.getBoundingClientRect();
    const rect2 = element2.getBoundingClientRect();
    
    const center1X = rect1.left + rect1.width / 2;
    const center1Y = rect1.top + rect1.height / 2;
    const center2X = rect2.left + rect2.width / 2;
    const center2Y = rect2.top + rect2.height / 2;
    
    return Math.sqrt(Math.pow(center2X - center1X, 2) + Math.pow(center2Y - center1Y, 2));
  }
  
  // 🎯 테이크부터 순차적 재생 시작
  async startPlaybackFromTake(startTake) {
    console.log(`🎬 재생 시작: ${startTake.id} (${startTake.text.substring(0, 30)}...)`);
    
    // 이전 재생 중지
    this.stopAll();
    
    // 재생할 테이크 목록 설정 (시작 테이크부터 끝까지)
    const startIndex = this.preTakes.findIndex(take => take.id === startTake.id);
    this.currentPlayList = this.preTakes.slice(startIndex);
    this.currentTakeIndex = 0;
    this.currentPlayingTakeId = startTake.id;
    
    console.log(`📋 재생 목록: ${this.currentPlayList.length}개 테이크 (${startIndex + 1}번째부터)`);
    
    // UI 업데이트
    this.updateStatus(`재생 준비 중... (${startIndex + 1}/${this.preTakes.length})`, '#FF9800');
    this.updatePlaybackUI(startTake);
    
    // 🎯 첫 번째 테이크 재생 시작
    await this.playTakeAtIndex(0);
    
    // 🎯 다음 테이크들 백그라운드 버퍼링 시작
    this.startBackgroundBuffering(1);
  }
  
  // 🎯 인덱스에 해당하는 테이크 재생
  async playTakeAtIndex(playListIndex) {
    if (!this.currentPlayList || playListIndex >= this.currentPlayList.length) {
      console.log('✅ 모든 테이크 재생 완료');
      this.updateStatus('재생 완료', '#4CAF50');
      return;
    }
    
    const take = this.currentPlayList[playListIndex];
    this.currentTakeIndex = playListIndex;
    this.currentPlayingTakeId = take.id;
    
    console.log(`🎵 테이크 재생: ${take.id} (${playListIndex + 1}/${this.currentPlayList.length})`);
    
    // UI 업데이트
    this.updatePlaybackUI(take);
    this.updateStatus(`재생 중... (${playListIndex + 1}/${this.currentPlayList.length})`, '#4CAF50');
    
    try {
      let audioUrl;
      
      // 🚀 이미 버퍼링된 경우 바로 재생
      if (take.isBuffered && take.audioUrl) {
        console.log(`🎯 버퍼링된 오디오 즉시 재생: ${take.id}`);
        audioUrl = take.audioUrl;
      } else {
        // 버퍼링되지 않은 경우 생성
        console.log(`🔄 테이크 실시간 생성: ${take.id}`);
        this.updateStatus(`음성 생성 중... (${playListIndex + 1}/${this.currentPlayList.length})`, '#FF9800');
        
        audioUrl = await this.convertToSpeech(take);
        if (audioUrl) {
          take.audioUrl = audioUrl;
          take.isBuffered = true;
        }
      }
      
      if (audioUrl) {
        await this.playAudioWithTracking(audioUrl, take);
      } else {
        console.error(`❌ 테이크 재생 실패: ${take.id}`);
        // 다음 테이크로 넘어가기
        await this.playTakeAtIndex(playListIndex + 1);
      }
      
    } catch (error) {
      console.error(`❌ 테이크 재생 오류: ${take.id}`, error);
      await this.playTakeAtIndex(playListIndex + 1);
    }
  }
  
  // 🎯 백그라운드 버퍼링 시작
  async startBackgroundBuffering(startIndex) {
    if (!this.currentPlayList || startIndex >= this.currentPlayList.length) {
      return;
    }
    
    console.log(`🔄 백그라운드 버퍼링 시작: ${startIndex}번째부터`);
    
    // 최대 3개까지 미리 버퍼링
    const bufferCount = Math.min(3, this.currentPlayList.length - startIndex);
    
    for (let i = 0; i < bufferCount; i++) {
      const bufferIndex = startIndex + i;
      if (bufferIndex < this.currentPlayList.length) {
        const take = this.currentPlayList[bufferIndex];
        
        if (!take.isBuffered) {
          this.bufferTakeInBackground(take);
        }
      }
    }
  }
  
  // 🎯 백그라운드에서 테이크 버퍼링
  async bufferTakeInBackground(take) {
    if (this.bufferingTakes.has(take.id) || take.isBuffered) {
      return;
    }
    
    this.bufferingTakes.add(take.id);
    console.log(`🔄 백그라운드 버퍼링: ${take.id}`);
    
    // 🎯 App.js 스타일 알파값 애니메이션 적용
    this.applyBufferingAnimation(take.element);
    
    try {
      const audioUrl = await this.convertToSpeech(take);
      if (audioUrl) {
        take.audioUrl = audioUrl;
        take.isBuffered = true;
        console.log(`✅ 버퍼링 완료: ${take.id}`);
      }
    } catch (error) {
      console.error(`❌ 버퍼링 실패: ${take.id}`, error);
    } finally {
      this.bufferingTakes.delete(take.id);
      this.removeBufferingAnimation(take.element);
    }
  }
  
  // 🎯 App.js 스타일 버퍼링 알파값 애니메이션 적용
  applyBufferingAnimation(element) {
    if (!element) return;
    
    // 기존 애니메이션 제거
    element.style.animation = '';
    
    // App.js의 fadeInOut 애니메이션 적용
    element.style.animation = 'tts-buffering 3s infinite';
    
    // CSS 애니메이션이 없으면 스타일시트에 추가
    if (!document.querySelector('#tts-buffering-animation')) {
      const style = document.createElement('style');
      style.id = 'tts-buffering-animation';
      style.textContent = `
        @keyframes tts-buffering {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // 🎯 버퍼링 애니메이션 제거
  removeBufferingAnimation(element) {
    if (!element) return;
    
    element.style.animation = '';
    element.style.opacity = '';
  }
  
  // 🎯 오디오 재생 + App.js 스타일 단어 트래킹
  async playAudioWithTracking(audioUrl, take) {
    return new Promise((resolve, reject) => {
      this.currentAudio = new Audio(audioUrl);
      this.isPlaying = true;
      this.isPaused = false;
      
      console.log(`🎵 오디오 재생 시작: ${take.id}`);
      
      // 🎯 App.js 스타일 단어 트래킹 준비
      this.prepareWordTracking(take);
      
      this.currentAudio.onloadedmetadata = () => {
        console.log(`📊 오디오 메타데이터 로드 완료 - 길이: ${this.currentAudio.duration}초`);
        this.startAppJsStyleWordTracking(take);
      };
      
      this.currentAudio.ontimeupdate = () => {
        if (this.currentAudio && this.currentAudio.duration) {
          this.updateAppJsStyleWordTracking(take);
          
          // 진행률 업데이트
          const progress = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;
          this.updateProgress(progress);
        }
      };
      
      this.currentAudio.onended = () => {
        console.log(`✅ 테이크 재생 완료: ${take.id}`);
        this.isPlaying = false;
        
        // 단어 트래킹 정리
        this.cleanupWordTracking();
        
        // 다음 테이크 재생
        const nextIndex = this.currentTakeIndex + 1;
        if (nextIndex < this.currentPlayList.length) {
          // 더 많은 테이크 버퍼링
          this.startBackgroundBuffering(nextIndex + 1);
          setTimeout(() => this.playTakeAtIndex(nextIndex), 100);
        } else {
          console.log('🎉 모든 테이크 재생 완료');
          this.updateStatus('재생 완료', '#4CAF50');
        }
        
        resolve();
      };
      
      this.currentAudio.onerror = (error) => {
        console.error(`❌ 오디오 재생 오류: ${take.id}`, error);
        this.isPlaying = false;
        reject(error);
      };
      
      this.currentAudio.play().catch(reject);
    });
  }
  
  // 🎯 App.js 스타일 단어 트래킹 준비
  prepareWordTracking(take) {
    // 기존 트래킹 정리
    this.cleanupWordTracking();
    
    // 텍스트를 단어별로 분할
    this.currentTakeWords = this.splitIntoWords(take.text, take.language);
    this.currentTakeWordElements = [];
    
    console.log(`🔤 단어 트래킹 준비: ${this.currentTakeWords.length}개 단어`);
    
    // DOM에서 해당 텍스트에 span 래핑
    this.wrapWordsInElement(take.element, take.text);
  }
  
  // 🎯 App.js 스타일 단어 분할 (언어별 가중치 적용)
  splitIntoWords(text, language) {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    
    return words.map(word => ({
      text: word,
      weight: this.calculateWordWeight(word, language)
    }));
  }
  
  // 🎯 단어 가중치 계산 (App.js 로직)
  calculateWordWeight(word, language) {
    // 기본 가중치
    let weight = 1;
    
    // 언어별 가중치 조정
    if (language === 'ko') {
      // 한국어: 글자 수 기반
      weight = word.length * 0.3;
    } else {
      // 영어: 음절 수 추정
      weight = this.estimateSyllables(word) * 0.2;
    }
    
    // 구두점이 있으면 가중치 증가
    if (/[.!?]/.test(word)) {
      weight += 0.5;
    }
    
    return Math.max(0.1, weight); // 최소 가중치 보장
  }
  
  // 🎯 영어 음절 수 추정
  estimateSyllables(word) {
    const vowels = word.match(/[aeiouy]+/gi);
    return vowels ? vowels.length : 1;
  }
  
  // 🎯 App.js 스타일 단어 트래킹 시작
  startAppJsStyleWordTracking(take) {
    console.log(`🎯 App.js 스타일 단어 트래킹 시작: ${take.id}`);
    
    // 🎯 테이크 시작 시 한 번만 스크롤
    if (take.element) {
      console.log(`📜 테이크 시작 - 요소로 스크롤: <${take.element.tagName.toLowerCase()}>`);
      take.element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }
  }
  
  // 🎯 App.js 스타일 단어 트래킹 업데이트
  updateAppJsStyleWordTracking(take) {
    if (!this.currentAudio || !this.currentTakeWords || this.currentTakeWords.length === 0) {
      return;
    }
    
    const currentTime = this.currentAudio.currentTime;
    const duration = this.currentAudio.duration;
    
    // App.js의 calculateCurrentWordIndex 로직
    const currentWordIndex = this.calculateCurrentWordIndex(currentTime, duration, this.currentTakeWords);
    
    // 이전 하이라이트 제거
    this.currentTakeWordElements.forEach(element => {
      if (element && element.classList) {
        element.classList.remove('tts-current-word-appjs');
      }
    });
    
    // 🎯 App.js 스타일 갈색 밑줄 하이라이트 적용
    if (currentWordIndex >= 0 && currentWordIndex < this.currentTakeWordElements.length) {
      const currentWordElement = this.currentTakeWordElements[currentWordIndex];
      if (currentWordElement) {
        currentWordElement.classList.add('tts-current-word-appjs');
        
        // UI 업데이트
        const currentWord = this.currentTakeWords[currentWordIndex]?.text || '';
        this.updateWordInfo(currentWordIndex + 1, this.currentTakeWords.length, currentWord);
      }
    }
  }
  
  // 🎯 App.js의 calculateCurrentWordIndex 로직 재현
  calculateCurrentWordIndex(currentTime, duration, words) {
    if (!duration || !words || words.length === 0) return 0;
    
    const totalDuration = duration + 1;
    const totalWeight = words.reduce((sum, word) => sum + word.weight, 0);
    const timePerWeight = totalWeight > 0 ? totalDuration / totalWeight : 0;
    
    let accumulatedTime = 0;
    for (let i = 0; i < words.length; i++) {
      const wordDuration = words[i].weight * timePerWeight;
      accumulatedTime += wordDuration;
      if (currentTime < accumulatedTime) {
        return i;
      }
    }
    
    return Math.max(0, words.length - 1);
  }
  
  // 🎯 단어 래핑 (DOM에서 텍스트를 span으로 감싸기)
  wrapWordsInElement(element, targetText) {
    if (!element || !targetText) return;
    
    console.log(`🔤 단어 래핑 시작: ${targetText.substring(0, 50)}...`);
    
    // TreeWalker로 텍스트 노드들 찾기
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.trim().length > 0) {
        textNodes.push(node);
      }
    }
    
    // 각 텍스트 노드에서 단어들을 span으로 래핑
    for (const textNode of textNodes) {
      this.wrapWordsInTextNode(textNode);
    }
    
    console.log(`✅ 단어 래핑 완료: ${this.currentTakeWordElements.length}개 span 생성`);
  }
  
  // 🎯 단일 텍스트 노드에서 단어 래핑
  wrapWordsInTextNode(textNode) {
    const text = textNode.textContent;
    const words = text.split(/(\s+)/); // 공백도 보존
    
    if (words.length <= 1) return;
    
    const fragment = document.createDocumentFragment();
    
    for (const word of words) {
      if (word.trim().length > 0) {
        // 단어인 경우 span으로 감싸기
        const span = document.createElement('span');
        span.textContent = word;
        span.className = 'tts-word-appjs';
        this.currentTakeWordElements.push(span);
        fragment.appendChild(span);
      } else {
        // 공백인 경우 그대로 추가
        fragment.appendChild(document.createTextNode(word));
      }
    }
    
    // 원본 텍스트 노드를 새로운 구조로 교체
    textNode.parentNode.replaceChild(fragment, textNode);
  }
  
  // 🎯 단어 트래킹 정리
  cleanupWordTracking() {
    // 기존 래핑 제거
    const wrappedWords = document.querySelectorAll('.tts-word-appjs, .tts-current-word-appjs');
    wrappedWords.forEach(span => {
      if (span.parentNode) {
        span.parentNode.replaceChild(document.createTextNode(span.textContent), span);
      }
    });
    
    // 인접한 텍스트 노드들 병합
    document.normalize && document.normalize();
    
    // 배열 초기화
    this.currentTakeWords = [];
    this.currentTakeWordElements = [];
    
    console.log('🧹 단어 트래킹 정리 완료');
  }
  
  // 🎯 재생 UI 업데이트
  updatePlaybackUI(take) {
    if (!take) return;
    
    // 테이크 정보 업데이트
    if (this.takeInfoLabel) {
      const totalTakes = this.currentPlayList ? this.currentPlayList.length : this.preTakes.length;
      const currentIndex = this.currentTakeIndex + 1;
      const elementType = take.element?.tagName.toLowerCase() || 'unknown';
      const elementDesc = elementType === 'p' ? '📝 문단' : '📦 영역';
      const language = take.language === 'ko' ? '🇰🇷' : '🇺🇸';
      
      this.takeInfoLabel.textContent = `${elementDesc} ${currentIndex}/${totalTakes} | <${elementType}> ${language}`;
    }
    
    // HTML 뷰어 업데이트
    if (this.htmlViewer && take.element) {
      const htmlCode = this.generateHighlightedHtml(take.element, take.text);
      this.htmlViewer.innerHTML = htmlCode;
    }
    
    // 음성 라벨 업데이트
    if (this.voiceLabel) {
      this.voiceLabel.textContent = `🎵 음성: ${this.selectedVoice.name}`;
    }
  }
  
  // 🎯 전체 정지 (새로운 로직에 맞게 수정)
  stopAll() {
    console.log('🛑 모든 재생 중지');
    
    // 오디오 정지
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    
    // 상태 초기화
    this.isPlaying = false;
    this.isPaused = false;
    this.currentPlayList = [];
    this.currentTakeIndex = 0;
    this.currentPlayingTakeId = null;
    
    // 버퍼링 중지
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    // 버퍼링 애니메이션 제거
    this.bufferingTakes.clear();
    document.querySelectorAll('[style*="tts-buffering"]').forEach(element => {
      this.removeBufferingAnimation(element);
    });
    
    // 단어 트래킹 정리
    this.cleanupWordTracking();
    
    // UI 업데이트
    this.updateStatus('재생 중지됨', '#FF9800');
    this.updateProgress(0);
    
    console.log('✅ 정지 완료');
  }

  // 음성 선택
  selectVoice(index) {
    if (index >= 0 && index < this.VOICES.length) {
      this.selectedVoice = this.VOICES[index];
      this.updateUI();
      console.log(`음성 선택: ${this.selectedVoice.name}`);
      
      // 새로운 시스템에서는 마우스 위치 기반으로 재생하므로 호환성만 유지
      console.log(`음성 선택됨: ${this.selectedVoice.name} - 마우스를 올리고 다시 키를 누르세요`);
      this.updateStatus(`음성 선택: ${this.selectedVoice.name}`, '#4CAF50');
    }
  }

  // UI 업데이트
  updateUI() {
    if (this.floatingUI) {
      const voiceLabel = this.floatingUI.querySelector('#tts-voice');
      if (voiceLabel) {
        voiceLabel.textContent = `음성: ${this.selectedVoice.name}`;
      }

      const shortcutInfo = this.floatingUI.querySelector('div:last-child');
      if (shortcutInfo) {
        shortcutInfo.innerHTML = `
          <div>1~0: 음성 선택 | ESC: 중지</div>
          <div>현재: ${this.selectedVoice.key}번 - ${this.selectedVoice.name}</div>
        `;
      }
    }
  }

  // 상태 업데이트
  updateStatus(status, color = '#4CAF50') {
    if (this.statusLabel) {
      this.statusLabel.textContent = status;
      this.statusLabel.style.color = color;
    }
  }

  // 진행률 업데이트
  updateProgress(percentage) {
    if (this.progressBar) {
      this.progressBar.style.width = `${percentage}%`;
    }
  }
  
  // 🎯 테이크 정보 업데이트 (언어 정보 포함)
  updateTakeInfo(takeIndex, totalTakes) {
    if (this.takeInfoLabel) {
      const take = this.takes[takeIndex];
      const elementType = take?.elementInfo?.metadata?.tagName || 'unknown';
      const elementDesc = elementType === 'p' ? '📝 문단' : '📦 영역';
      const language = take?.language || 'unknown';
      const languageFlag = language === 'ko' ? '🇰🇷' : language === 'en' ? '🇺🇸' : '🌐';
      
      this.takeInfoLabel.textContent = `${elementDesc} ${takeIndex + 1}/${totalTakes} | <${elementType}> ${languageFlag} ${language}`;
    }
  }
  
  // 🎯 단어 정보 업데이트
  updateWordInfo(currentWord, totalWords, wordText) {
    if (this.wordInfoLabel) {
      this.wordInfoLabel.textContent = `단어 ${currentWord}/${totalWords}: "${wordText}"`;
    }
  }
  
  // 🎯 HTML 코드 뷰어 업데이트
  updateHtmlViewer(element, currentTakeText) {
    if (!this.htmlViewer || !element) return;
    
    try {
      const htmlCode = this.generateHighlightedHtml(element, currentTakeText);
      this.htmlViewer.innerHTML = htmlCode;
    } catch (error) {
      console.error('HTML 뷰어 업데이트 실패:', error);
      this.htmlViewer.innerHTML = '<div style="color: #ff6b6b;">HTML 표시 오류</div>';
    }
  }
  
  // 🎯 현재 요소의 HTML을 하이라이트하여 생성
  generateHighlightedHtml(element, currentText) {
    const tagName = element.tagName.toLowerCase();
    const attributes = this.getElementAttributes(element);
    const textContent = element.textContent.substring(0, 100); // 처음 100자만
    
    // 현재 재생 중인 텍스트 부분 하이라이트
    let highlightedContent = textContent;
    if (currentText) {
      const currentTextShort = currentText.substring(0, 30);
      highlightedContent = textContent.replace(
        currentTextShort,
        `<span class="html-current">${currentTextShort}</span>`
      );
    }
    
    return `
      <div>
        <span class="html-tag">&lt;${tagName}</span>
        ${attributes}
        <span class="html-tag">&gt;</span>
      </div>
      <div style="margin-left: 10px; margin-top: 5px;">
        <span class="html-text">${highlightedContent}${textContent.length > 100 ? '...' : ''}</span>
      </div>
      <div>
        <span class="html-tag">&lt;/${tagName}&gt;</span>
      </div>
    `;
  }
  
  // 요소의 주요 속성들을 문자열로 변환
  getElementAttributes(element) {
    const attrs = [];
    
    if (element.id) {
      attrs.push(`<span class="html-attr"> id="${element.id}"</span>`);
    }
    
    if (element.className) {
      const classes = element.className.trim().split(/\s+/).slice(0, 3); // 최대 3개 클래스만
      attrs.push(`<span class="html-attr"> class="${classes.join(' ')}"</span>`);
    }
    
    // 다른 중요한 속성들
    const importantAttrs = ['role', 'data-*', 'aria-*'];
    for (const attr of element.attributes) {
      if (importantAttrs.some(pattern => 
        pattern.includes('*') ? attr.name.startsWith(pattern.replace('*', '')) : attr.name === pattern
      )) {
        attrs.push(`<span class="html-attr"> ${attr.name}="${attr.value}"</span>`);
      }
    }
    
    return attrs.join('');
  }

  // 플로팅 UI 표시/숨김
  showUI() {
    if (this.floatingUI) {
      this.floatingUI.style.display = 'block';
    }
  }

  hideUI() {
    if (this.floatingUI) {
      this.floatingUI.style.display = 'none';
    }
  }

  // TTS 시작
  // 🎯 호환성을 위한 startTTS 래퍼 (레거시 시스템용)
  async startTTS(text, elementMetadata = null) {
    console.log('⚠️ 레거시 startTTS 호출됨 - 새로운 시스템은 마우스 위치 기반입니다');
    console.log('텍스트:', text?.substring(0, 50) + '...');
    
    // 새로운 시스템에서는 사용자에게 안내만 제공
    this.updateStatus('마우스를 콘텐츠에 올리고 1-0번 키를 누르세요', '#FF9800');
    
    // 5초 후에 안내 메시지 업데이트
    setTimeout(() => {
      this.updateStatus('TTS 준비 완료 - 마우스를 올리고 1~0번 키를 누르세요', '#4CAF50');
    }, 5000);
  }

  // 텍스트를 테이크로 분할 (App.js 로직 참고)
  async splitTextIntoTakes(text, elementMetadata = null) {
    // 🎯 선택된 전체 영역의 텍스트 사용 (화면 밖 텍스트도 포함)
    const selectedElement = elementMetadata?.domElement || window.ttsSelector?.currentElement;
    let targetText = text;
    
    if (selectedElement) {
      // 선택된 요소의 모든 텍스트 추출 (가시성 무관)
      const fullText = this.extractAllTextFromElement(selectedElement);
      if (fullText && fullText.length > text.length * 0.8) {
        // 추출된 텍스트가 원본의 80% 이상이면 사용
        targetText = fullText;
        console.log('선택된 요소에서 전체 텍스트 추출 완료');
      } else {
        console.log('원본 텍스트 사용 (추출 실패 또는 부족)');
      }
    }
    
    console.log('원본 텍스트 길이:', text.length);
    console.log('처리할 텍스트 길이:', targetText.length);
    console.log('텍스트 샘플:', targetText.substring(0, 100) + '...');
    
    // 🎯 기본 최대 길이 설정 (테이크별로 동적 조정)
    const defaultMaxLength = 250;
    console.log(`텍스트 분할 시작 - 기본 최대 길이: ${defaultMaxLength}자`);
    
    const takes = [];
    let takeNumber = 1;

    // 1차 분할: 공백/탭만 있는 줄이 2번 이상 연속될 때마다 분할 (문단 구분)
    const blocks = targetText.split(/(?:[ \t]*\r?\n){2,}/);
    console.log(`문단 분할: ${blocks.length}개 블록`);

    for (let block of blocks) {
      let remainingText = block.trim();
      
      // 빈 블록은 건너뛰기
      if (remainingText.length === 0) {
        continue;
      }
      
      // 🎯 블록 내에서 테이크 분할 (테이크별 언어 감지)
      while (remainingText.length > 0) {
        // 🎯 각 테이크마다 언어 감지하여 동적 길이 조정
        const currentSample = remainingText.substring(0, Math.min(300, remainingText.length));
        const currentLanguage = await this.detectLanguage(currentSample);
        const maxLength = currentLanguage === 'en' ? 300 : 200;
        
        if (remainingText.length <= maxLength) {
          // 남은 텍스트가 최대 길이 이하면 하나의 테이크로
          const takeElementInfo = this.findTakeElementInfo(remainingText, elementMetadata, selectedElement);
          
          takes.push({
            index: takeNumber - 1,
            text: remainingText,
            name: `Take ${takeNumber}`,
            language: currentLanguage,
            elementInfo: takeElementInfo
          });
          console.log(`✅ 테이크 ${takeNumber}: ${currentLanguage} (${remainingText.length}자)`);
          takeNumber++;
          break;
        }
        
        // 최대 길이를 초과하는 경우 적절한 위치에서 분할
        let cutIndex = this.findBestCutPosition(remainingText, maxLength);
        
        const takeText = remainingText.slice(0, cutIndex).trim();
        if (takeText.length > 0) {
          // 📍 각 테이크에 DOM 요소 정보 연결
          const takeElementInfo = this.findTakeElementInfo(takeText, elementMetadata, selectedElement);
          
          takes.push({
            index: takeNumber - 1,
            text: takeText,
            name: `Take ${takeNumber}`,
            language: currentLanguage,
            // 📍 테이크별 DOM 정보
            elementInfo: takeElementInfo
          });
          console.log(`✅ 테이크 ${takeNumber}: ${currentLanguage} (${takeText.length}자)`);
          takeNumber++;
        }
        
        remainingText = remainingText.slice(cutIndex).trim();
      }
    }
    
    console.log(`최종 테이크 개수: ${takes.length}`);
    takes.forEach((take, index) => {
      console.log(`🎯 테이크 ${index + 1} [${take.language}]: ${take.text.substring(0, 50)}... (${take.text.length}자)`);
    });
    
    return takes;
  }
  
  // 📍 테이크별 DOM 요소 정보 찾기
  findTakeElementInfo(takeText, sourceMetadata, sourceElement) {
    if (!sourceElement) {
      console.log('소스 요소 없음, 기본 메타데이터 사용');
      return {
        element: null,
        selector: sourceMetadata?.selector || '',
        metadata: sourceMetadata,
        confidence: 0
      };
    }
    
    // 🎯 테이크 텍스트가 포함된 가장 적절한 하위 요소 찾기
    const targetElement = this.findBestContainerForTake(takeText, sourceElement);
    
    if (targetElement && targetElement !== sourceElement) {
      const elementType = targetElement.tagName.toLowerCase();
      const elementDesc = elementType === 'p' ? '📝 문단' : '📦 영역';
      console.log(`테이크 "${takeText.substring(0, 30)}..." → ${elementDesc}: <${elementType}>.${targetElement.className}`);
      
      // 하위 요소 메타데이터 생성
      const takeMetadata = {
        tagName: targetElement.tagName.toLowerCase(),
        className: targetElement.className || '',
        id: targetElement.id || '',
        selector: this.generateTakeSelector(targetElement),
        parentSelector: sourceMetadata?.selector || '',
        domElement: targetElement
      };
      
      return {
        element: targetElement,
        selector: takeMetadata.selector,
        metadata: takeMetadata,
        confidence: elementType === 'p' ? 0.9 : 0.8  // p 태그는 더 높은 신뢰도
      };
    } else {
      console.log(`테이크 "${takeText.substring(0, 30)}..." → 📦 원본 요소 사용`);
      
      // 원본 요소 정보 사용
      return {
        element: sourceElement,
        selector: sourceMetadata?.selector || '',
        metadata: sourceMetadata,
        confidence: 0.5
      };
    }
  }
  
  // 🎯 테이크에 가장 적합한 컨테이너 요소 찾기
  findBestContainerForTake(takeText, parentElement) {
    const normalizedTakeText = this.normalizeForMatching(takeText);
    const takeWords = normalizedTakeText.split(/\s+/).filter(w => w.length > 2);
    
    // 최소 3개 키워드가 필요
    if (takeWords.length < 3) {
      return parentElement;
    }
    
    const keywordSample = takeWords.slice(0, Math.min(5, takeWords.length)).join(' ');
    
    console.log(`테이크 컨테이너 탐색 - 키워드: "${keywordSample}"`);
    
    // 하위 요소들을 BFS로 탐색
    const candidates = [];
    const walker = document.createTreeWalker(
      parentElement,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          // 🎯 의미 있는 컨테이너 요소들 (p 태그 우선 순위 높임)
          const meaningfulTags = ['p', 'div', 'article', 'section', 'blockquote', 'aside', 'main', 'header', 'footer'];
          if (!meaningfulTags.includes(node.tagName.toLowerCase())) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let currentNode;
    while (currentNode = walker.nextNode()) {
      const elementText = this.extractTextFromSingleElement(currentNode);
      const normalizedElementText = this.normalizeForMatching(elementText);
      
      // 키워드 매칭 확인
      const matchScore = this.calculateKeywordMatch(keywordSample, normalizedElementText);
      
      if (matchScore > 0.6) {  // 60% 이상 매칭
        candidates.push({
          element: currentNode,
          score: matchScore,
          textLength: elementText.length
        });
      }
    }
    
    // 🎯 최적 후보 선택 (p 태그 우선, 매칭 점수, 텍스트 길이 고려)
    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        // 1순위: p 태그 우선 (문단 단위 트래킹 선호)
        const aIsP = a.element.tagName.toLowerCase() === 'p';
        const bIsP = b.element.tagName.toLowerCase() === 'p';
        
        if (aIsP && !bIsP) return -1;  // a가 p태그이고 b가 아니면 a 우선
        if (!aIsP && bIsP) return 1;   // b가 p태그이고 a가 아니면 b 우선
        
        // 2순위: 텍스트 길이가 테이크와 비슷한 정도 (너무 크지 않은 것 선호)
        const aSizeDiff = Math.abs(a.textLength - takeText.length);
        const bSizeDiff = Math.abs(b.textLength - takeText.length);
        
        // 텍스트 길이가 테이크의 3배 이상인 경우 패널티
        const aPenalty = a.textLength > takeText.length * 3 ? 0.3 : 0;
        const bPenalty = b.textLength > takeText.length * 3 ? 0.3 : 0;
        
        // 3순위: 매칭 점수 (패널티 적용)
        const aFinalScore = a.score - aPenalty - aSizeDiff / 1000;
        const bFinalScore = b.score - bPenalty - bSizeDiff / 1000;
        
        return bFinalScore - aFinalScore;
      });
      
      const bestCandidate = candidates[0];
      console.log(`🎯 최적 컨테이너 발견: <${bestCandidate.element.tagName.toLowerCase()}>, 점수: ${bestCandidate.score.toFixed(2)}, 텍스트 길이: ${bestCandidate.textLength}`);
      return bestCandidate.element;
    }
    
    // 적절한 하위 요소가 없으면 원본 사용
    return parentElement;
  }
  
  // 🎯 단일 요소에서 텍스트 추출 (p 태그는 하위 요소 포함, div는 직접 텍스트만)
  extractTextFromSingleElement(element) {
    const tagName = element.tagName.toLowerCase();
    
    // p 태그의 경우 하위 인라인 요소들(em, strong, span 등)도 포함
    if (tagName === 'p') {
      return this.extractTextFromParagraph(element);
    }
    
    // div나 다른 블록 요소는 직접 텍스트 노드만
    let text = '';
    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent;
      }
    }
    
    return text.trim();
  }
  
  // 🎯 문단(p) 요소에서 텍스트 추출 (인라인 요소 포함)
  extractTextFromParagraph(pElement) {
    let text = '';
    
    // p 태그 내의 모든 텍스트 (인라인 요소 포함)
    const walker = document.createTreeWalker(
      pElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // 의미 없는 공백만 있는 텍스트 노드 제외
          if (node.textContent.trim().length === 0) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // 제외할 부모 요소 확인
          let parent = node.parentElement;
          while (parent && parent !== pElement) {
            const parentTag = parent.tagName.toLowerCase();
            if (['script', 'style', 'noscript'].includes(parentTag)) {
              return NodeFilter.FILTER_REJECT;
            }
            parent = parent.parentElement;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let textNode;
    while (textNode = walker.nextNode()) {
      text += textNode.textContent;
    }
    
    return text.trim();
  }
  
  // 키워드 매칭 점수 계산
  calculateKeywordMatch(keywords, text) {
    const keywordArray = keywords.split(/\s+/);
    let matchCount = 0;
    
    for (const keyword of keywordArray) {
      if (text.includes(keyword)) {
        matchCount++;
      }
    }
    
    return matchCount / keywordArray.length;
  }
  
  // 테이크용 선택자 생성
  generateTakeSelector(element) {
    let selector = element.tagName.toLowerCase();
    
    if (element.id) {
      selector += `#${element.id}`;
    } else if (element.className) {
      const classes = element.className.trim().split(/\s+/);
      selector += '.' + classes.slice(0, 2).join('.');  // 최대 2개 클래스만
    }
    
    return selector;
  }
  
  // 📍 메타데이터 발화 여부 결정
  shouldSpeakMetadata() {
    // 키보드 단축키나 설정에 따라 결정 (임시로 false)
    // 나중에 Shift + 숫자키 같은 조합으로 활성화 가능
    return false; // 일단 비활성화
  }
  
  // 📍 메타데이터를 음성 텍스트로 변환
  generateMetadataText(metadata) {
    const parts = [];
    
    // 요소 타입 정보
    if (metadata.tagName) {
      const elementType = this.getElementTypeDescription(metadata.tagName);
      if (elementType) {
        parts.push(elementType);
      }
    }
    
    // ID 정보
    if (metadata.id) {
      parts.push(`아이디 ${metadata.id}`);
    }
    
    // 클래스 정보 (의미 있는 것만)
    if (metadata.className) {
      const meaningfulClasses = this.extractMeaningfulClasses(metadata.className);
      if (meaningfulClasses.length > 0) {
        parts.push(`클래스 ${meaningfulClasses.join(', ')}`);
      }
    }
    
    // 부모 정보
    if (metadata.parentInfo && metadata.parentInfo.tagName) {
      const parentType = this.getElementTypeDescription(metadata.parentInfo.tagName);
      if (parentType) {
        parts.push(`${parentType} 내부`);
      }
    }
    
    if (parts.length > 0) {
      return `선택된 영역: ${parts.join(', ')}. `;
    }
    
    return '';
  }
  
  // 요소 타입을 한국어로 설명
  getElementTypeDescription(tagName) {
    const descriptions = {
      'article': '기사',
      'section': '섹션',
      'div': '영역',
      'p': '문단',
      'h1': '제목1',
      'h2': '제목2',
      'h3': '제목3',
      'h4': '제목4',
      'h5': '제목5',
      'h6': '제목6',
      'header': '헤더',
      'main': '메인 콘텐츠',
      'aside': '사이드바',
      'footer': '푸터',
      'blockquote': '인용문',
      'ul': '목록',
      'ol': '순서 목록',
      'li': '목록 항목'
    };
    
    return descriptions[tagName.toLowerCase()] || null;
  }
  
  // 의미 있는 클래스명만 추출
  extractMeaningfulClasses(className) {
    const classes = className.trim().split(/\s+/);
    const meaningful = [];
    
    // 🎯 의미 있는 패턴들 (p 태그 관련 패턴 추가)
    const meaningfulPatterns = [
      /^article/i, /^content/i, /^main/i, /^body/i,
      /^header/i, /^title/i, /^paragraph/i, /^section/i,
      /^news/i, /^story/i, /^post/i, /^blog/i,
      /^text/i, /^para/i, /^desc/i, /^summary/i  // p 태그 관련 추가
    ];
    
    for (const cls of classes) {
      // 너무 길거나 짧은 것 제외
      if (cls.length < 3 || cls.length > 20) continue;
      
      // 숫자만 있는 것 제외
      if (/^\d+$/.test(cls)) continue;
      
      // 의미 있는 패턴 확인
      if (meaningfulPatterns.some(pattern => pattern.test(cls))) {
        meaningful.push(cls);
      }
    }
    
    return meaningful.slice(0, 2); // 최대 2개까지만
  }

  // 최적의 분할 위치 찾기 (App.js 로직 참고)
  findBestCutPosition(text, maxLength) {
    // 1순위: 문장 끝 기호들 (마침표, 느낌표, 물음표 등)
    const lastPeriod = text.lastIndexOf('.', maxLength);
    const lastExclam = text.lastIndexOf('!', maxLength);
    const lastQuestion = text.lastIndexOf('?', maxLength);
    const lastTilde = text.lastIndexOf('~', maxLength);
    
    // 한국어 문장 끝 기호들
    const lastKoreanPeriod = text.lastIndexOf('。', maxLength);
    const lastKoreanComma = text.lastIndexOf('、', maxLength);
    
    // 따옴표들 (문장 끝일 수 있음)
    const lastQuote1 = text.lastIndexOf('"', maxLength);
    const lastQuote2 = text.lastIndexOf('"', maxLength);
    const lastQuote3 = text.lastIndexOf("'", maxLength);
    const lastQuote4 = text.lastIndexOf("'", maxLength);
    
    // 1순위: 완전한 문장 끝 기호들
    const sentenceEndCandidates = [
      lastPeriod, lastExclam, lastQuestion, lastTilde, 
      lastKoreanPeriod, lastKoreanComma,
      lastQuote1, lastQuote2, lastQuote3, lastQuote4
    ].filter(idx => idx > 0);
    
    // 2순위: 절 구분 기호들 (쉼표, 세미콜론 등)
    const lastComma = text.lastIndexOf(',', maxLength);
    const lastSemicolon = text.lastIndexOf(';', maxLength);
    const lastColon = text.lastIndexOf(':', maxLength);
    
    const clauseEndCandidates = [
      lastComma, lastSemicolon, lastColon
    ].filter(idx => idx > 0);
    
    // 3순위: 공백
    const lastSpace = text.lastIndexOf(' ', maxLength);
    
    // 1순위: 문장 끝 기호가 있으면 우선 사용
    if (sentenceEndCandidates.length > 0) {
      const bestSentenceEnd = Math.max(...sentenceEndCandidates);
      const nextChar = text[bestSentenceEnd + 1];
      if (nextChar && nextChar === ' ') {
        return bestSentenceEnd + 2; // 기호 + 공백 다음
      } else {
        return bestSentenceEnd + 1; // 기호 다음
      }
    }
    
    // 2순위: 절 구분 기호 사용
    if (clauseEndCandidates.length > 0) {
      const bestClauseEnd = Math.max(...clauseEndCandidates);
      // 쉼표나 세미콜론 다음 공백에서 자르기
      const nextChar = text[bestClauseEnd + 1];
      if (nextChar && nextChar === ' ') {
        return bestClauseEnd + 2; // 기호 + 공백 다음
      } else {
        return bestClauseEnd + 1; // 기호 다음
      }
    }
    
    // 3순위: 마지막 공백에서 자르기
    if (lastSpace > 0) {
      return lastSpace;
    }
    
    // 최후: 최대 길이에서 강제로 자르기
    return maxLength;
  }

  // 🆕 선택된 요소의 모든 텍스트 추출 (본문만, UI 요소 제외)
  extractAllTextFromElement(element) {
    if (!element) return '';

    const allTexts = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent.trim();
      if (text.length > 0) {
        const parentElement = node.parentElement;
        
        // 🎯 다층 필터링: 본문 콘텐츠만 추출
        if (parentElement && this.isMainContentText(parentElement, text)) {
          allTexts.push(text);
        }
      }
    }

    console.log(`총 ${allTexts.length}개 텍스트 블록 추출`);
    return allTexts.join(' ');
  }

  // 🔍 본문 콘텐츠인지 판단 (제목, 캡션 포함)
  isMainContentText(element, text) {
    // 🎯 우선 포함: 의미 있는 콘텐츠 요소들
    if (this.isImportantContent(element, text)) {
      return true;
    }

    // 1차: 기본 제외 요소 확인
    if (this.isExcludedElement(element)) {
      return false;
    }

    // 2차: 텍스트 품질 확인
    const textLength = text.length;
    
    // 🎯 버튼/인터페이스 텍스트 패턴 제외 (영어+한국어)
    const buttonPatterns = [
      // 영어 패턴
      /^(click|tap|press|button|btn)/i,           // "Click here", "Button"
      /^(more|view|show|hide|toggle)/i,           // "More info", "View all"
      /^(close|cancel|ok|yes|no|submit)/i,        // "Close", "Cancel", "OK"
      /^(login|logout|sign\s*in|sign\s*up)/i,     // "Login", "Sign in"
      /^(share|like|follow|subscribe)/i,          // "Share", "Like", "Follow"
      /^(next|prev|previous|back|home)/i,         // "Next", "Previous", "Back"
      /^(menu|nav|navigation)/i,                  // "Menu", "Navigation"
      /^(search|filter|sort)/i,                   // "Search", "Filter", "Sort"
      /^(select|choose|option)/i,                 // "Select", "Choose"
      /^(edit|delete|remove|add)/i,               // "Edit", "Delete", "Add"
      /^(save|download|upload|print)/i,           // "Save", "Download"
      /^(play|pause|stop|mute)/i,                 // "Play", "Pause", "Stop"
      
      // 한국어 패턴
      /^(클릭|탭|누르|버튼|눌러)/,                   // "클릭", "버튼", "누르세요"
      /^(더보기|더|보기|숨기기|토글)/,               // "더보기", "보기", "숨기기"
      /^(닫기|취소|확인|예|아니|전송)/,               // "닫기", "취소", "확인"
      /^(로그인|로그아웃|가입|회원)/,                // "로그인", "회원가입"
      /^(공유|좋아|팔로|구독)/,                     // "공유", "좋아요", "구독"
      /^(다음|이전|뒤로|홈)/,                       // "다음", "이전", "뒤로"
      /^(메뉴|네비|내비)/,                         // "메뉴", "네비게이션"
      /^(검색|필터|정렬)/,                         // "검색", "필터", "정렬"
      /^(선택|선택하|옵션)/,                       // "선택", "옵션"
      /^(편집|삭제|제거|추가)/,                     // "편집", "삭제", "추가"
      /^(저장|다운|업로드|인쇄)/,                   // "저장", "다운로드", "인쇄"
      /^(재생|정지|음소거)/,                       // "재생", "정지", "음소거"
      
      // 숫자, 날짜 패턴
      /^\d+$/, /^\d{1,2}\/\d{1,2}\/\d{4}$/       // 숫자만, 날짜
    ];
    
    // 버튼 패턴 확인
    if (buttonPatterns.some(pattern => pattern.test(text.trim()))) {
      return false;
    }
    
    // 너무 짧은 텍스트 (버튼, 라벨 등) 제외
    if (textLength < 8) {  // 5자 → 8자로 더 엄격하게
      return false;
    }
    
    // 3차: 본문다운 텍스트인지 확인
    const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
    
    // 문장이 하나도 없으면 제외
    if (sentences.length === 0) {
      return false;
    }
    
    // 한 문장이라도 10글자 이상이면 본문으로 간주
    const hasSubstantialSentence = sentences.some(sentence => sentence.trim().length >= 10);
    if (!hasSubstantialSentence) {
      return false;
    }
    
    // 4차: CNN 특화 본문 패턴 확인
    const articleKeywords = [
      'said', 'according to', 'reported', 'told', 'sources', 
      'officials', 'president', 'government', 'said in a statement'
    ];
    
    const hasArticlePattern = articleKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
    
    // 긴 텍스트이거나 기사 패턴이 있으면 본문으로 간주
    if (textLength >= 50 || hasArticlePattern) {
      return true;
    }
    
    // 5차: 컨텍스트 확인 (주변 요소들)
    const elementTag = element.tagName.toLowerCase();
    const isContentTag = ['p', 'div', 'article', 'section', 'span'].includes(elementTag);
    
    if (isContentTag && textLength >= 20) {
      return true;
    }
    
    return false;
  }

  // 🎯 중요한 콘텐츠인지 판단 (제목, 캡션, 의미 있는 메타데이터)
  isImportantContent(element, text) {
    const textLength = text.length;
    
    // 너무 짧은 텍스트는 제외 (단, 제목은 예외)
    if (textLength < 3) {
      return false;
    }

    // 1. 제목 태그들 (H1~H6)
    const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    if (headingTags.includes(element.tagName.toLowerCase())) {
      console.log(`제목 포함: ${text.substring(0, 30)}...`);
      return true;
    }

    // 2. itemprop 속성 기반 (구조화 데이터)
    const itemprop = element.getAttribute('itemprop');
    if (itemprop) {
      const importantItemProps = [
        'headline', 'name', 'title', 'caption', 'description',
        'author', 'datePublished', 'articleBody', 'summary',
        'alternativeHeadline', 'disambiguatingDescription'
      ];
      
      if (importantItemProps.includes(itemprop.toLowerCase())) {
        console.log(`중요 itemprop 포함 (${itemprop}): ${text.substring(0, 30)}...`);
        return true;
      }
    }

    // 3. Schema.org 클래스들
    const className = (element.className || '').toLowerCase();
    const importantSchemaClasses = [
      'headline', 'title', 'caption', 'summary', 'description',
      'article-title', 'article-headline', 'post-title'
    ];
    
    if (importantSchemaClasses.some(cls => className.includes(cls))) {
      console.log(`중요 클래스 포함: ${text.substring(0, 30)}...`);
      return true;
    }

    // 4. role 속성 기반
    const role = element.getAttribute('role');
    if (role) {
      const importantRoles = ['heading', 'article', 'main'];
      if (importantRoles.includes(role.toLowerCase())) {
        console.log(`중요 role 포함 (${role}): ${text.substring(0, 30)}...`);
        return true;
      }
    }

    // 5. 의미론적 HTML5 태그들
    const semanticTags = ['article', 'section', 'header', 'main', 'aside'];
    if (semanticTags.includes(element.tagName.toLowerCase()) && textLength >= 10) {
      console.log(`의미론적 태그 포함: ${text.substring(0, 30)}...`);
      return true;
    }

    // 6. 캡션 관련 특별 처리
    const parentElement = element.parentElement;
    if (parentElement) {
      const parentClass = (parentElement.className || '').toLowerCase();
      const parentTag = parentElement.tagName.toLowerCase();
      
      // figure > figcaption 패턴
      if (parentTag === 'figure' || parentClass.includes('figure') ||
          element.tagName.toLowerCase() === 'figcaption' ||
          className.includes('caption') || className.includes('photo')) {
        console.log(`캡션 요소 포함: ${text.substring(0, 30)}...`);
        return true;
      }
    }

    // 7. 저자, 날짜 등 기사 메타데이터 (적당한 길이)
    if (textLength >= 5 && textLength <= 100) {
      const metadataPatterns = [
        /^by\s+[\w\s]+$/i,           // "By John Doe"
        /\d{4}년?\s*\d{1,2}월?\s*\d{1,2}일?/,  // 날짜 패턴
        /^updated?\s*:/i,            // "Updated:"
        /^published?\s*:/i,          // "Published:"
        /\w+\s+(ago|전)$/i          // "3 hours ago"
      ];
      
      if (metadataPatterns.some(pattern => pattern.test(text.trim()))) {
        console.log(`메타데이터 포함: ${text.substring(0, 30)}...`);
        return true;
      }
    }

    return false;
  }

  // 🔍 제외할 요소 판단 (버튼, 메타데이터, 접근성 텍스트 등)
  isExcludedElement(element) {
    // 1. 태그 기반 제외 (스크립트, 스타일, 폼 요소 등)
    const excludedTags = [
      'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'BUTTON', 'INPUT', 
      'SELECT', 'TEXTAREA', 'FORM', 'LABEL', 'FIELDSET', 'LEGEND'
    ];
    
    if (excludedTags.includes(element.tagName)) {
      return true;
    }

    // 2. Role 기반 제외 (접근성 속성)
    const excludedRoles = [
      'button', 'link', 'menu', 'menubar', 'menuitem', 'tab', 'tabpanel',
      'toolbar', 'navigation', 'banner', 'contentinfo', 'complementary',
      'form', 'search', 'dialog', 'alertdialog', 'alert', 'status'
    ];
    
    const role = element.getAttribute('role');
    if (role && excludedRoles.includes(role.toLowerCase())) {
      return true;
    }

    // 3. 클래스명 기반 제외 (더 포괄적)
    const excludedClasses = [
      // 광고 관련
      'ad', 'advertisement', 'banner', 'promo', 'sponsored',
      // 네비게이션 관련
      'menu', 'nav', 'navigation', 'header', 'footer', 'sidebar',
      // 버튼 및 인터랙션 요소
      'button', 'btn', 'link', 'tab', 'tabs', 'dropdown',
      // 메타데이터 및 UI 요소
      'metadata', 'byline', 'timestamp', 'tags', 'category', 'topic',
      'share', 'social', 'feedback', 'comment', 'rating',
      // CNN 특화
      'cnn-poll', 'cnn-related', 'cnn-newsletter', 'live-story',
      // 접근성 및 숨김 요소
      'screen-reader', 'sr-only', 'visually-hidden', 'hidden',
      // 기타 UI 요소
      'widget', 'tooltip', 'popup', 'modal', 'overlay'
    ];

    const className = (element.className || '').toLowerCase();
    
    // 🎯 버튼 관련 div 및 하위 요소 강력 제외
    if (className.includes('btn')) {
      console.log(`🚫 버튼 div 제외: <${element.tagName.toLowerCase()}> class="${element.className}"`);
      return true;
    }
    
    // 🎯 네이버/포털 사이트 가상 버튼 및 복사 방지 요소 제외
    const virtualButtonPatterns = [
      // 네이버 특화
      'copy', 'clipboard', 'share', 'sns', 'naver', 'social',
      // 복사 방지/보안 관련
      'selection', 'protect', 'guard', 'prevent', 'block',
      // 가상 버튼/오버레이
      'virtual', 'overlay', 'floating', 'popup', 'tooltip',
      // 광고/프로모션
      'promo', 'promotion', 'advertisement', 'sponsored',
      // 기타 UI 방해 요소
      'widget', 'gadget', 'embed', 'iframe-wrap'
    ];
    
    for (const pattern of virtualButtonPatterns) {
      if (className.includes(pattern)) {
        console.log(`🚫 가상 버튼/방해 요소 제외: <${element.tagName.toLowerCase()}> class="${element.className}"`);
        return true;
      }
    }
    
    // 🎯 가상 버튼 스타일 기반 감지 (네이버 등 포털사이트 대응)
    const computedStyle = window.getComputedStyle && window.getComputedStyle(element);
    if (computedStyle) {
      // 절대 위치로 배치된 가상 버튼들
      const position = computedStyle.position;
      const zIndex = parseInt(computedStyle.zIndex) || 0;
      
      if ((position === 'absolute' || position === 'fixed') && zIndex > 100) {
        // 크기가 매우 작거나 투명한 요소들 (가상 버튼일 가능성)
        const opacity = parseFloat(computedStyle.opacity) || 1;
        const width = parseFloat(computedStyle.width) || 0;
        const height = parseFloat(computedStyle.height) || 0;
        
        if (opacity < 0.1 || (width < 10 && height < 10)) {
          console.log(`🚫 가상 버튼 스타일 감지: 투명/소형 요소 (opacity: ${opacity}, size: ${width}x${height})`);
          return true;
        }
      }
    }
    
    // 🎯 데이터 속성 기반 감지
    const dataAttributes = element.dataset || {};
    const suspiciousDataKeys = ['track', 'ga', 'analytics', 'event', 'action', 'copy', 'share'];
    
    for (const key of Object.keys(dataAttributes)) {
      for (const suspicious of suspiciousDataKeys) {
        if (key.toLowerCase().includes(suspicious)) {
          console.log(`🚫 가상 버튼 데이터 속성 감지: data-${key}="${dataAttributes[key]}"`);
          return true;
        }
      }
    }
    
    // 부모 요소 중에 btn 클래스가 있는지 확인 (최대 3레벨까지)
    let parent = element.parentElement;
    let level = 0;
    while (parent && level < 3) {
      const parentClassName = (parent.className || '').toLowerCase();
      if (parentClassName.includes('btn')) {
        console.log(`🚫 버튼 부모 요소로 인한 제외: <${element.tagName.toLowerCase()}> (부모: <${parent.tagName.toLowerCase()}> class="${parent.className}")`);
        return true;
      }
      parent = parent.parentElement;
      level++;
    }
    
    if (excludedClasses.some(cls => className.includes(cls))) {
      return true;
    }

    // 4. ID 기반 제외
    const excludedIds = [
      'ad', 'advertisement', 'banner', 'header', 'footer', 'nav',
      'menu', 'sidebar', 'poll', 'newsletter', 'feedback'
    ];

    const elementId = (element.id || '').toLowerCase();
    if (excludedIds.some(id => elementId.includes(id))) {
      return true;
    }

    // 5. ARIA 속성 기반 제외
    const ariaLabel = element.getAttribute('aria-label');
    const ariaDescribedBy = element.getAttribute('aria-describedby');
    
    if (ariaLabel && (ariaLabel.includes('button') || ariaLabel.includes('menu') || 
                     ariaLabel.includes('navigation') || ariaLabel.includes('link'))) {
      return true;
    }

    // 6. 데이터 속성 기반 제외 (추적, 분석 등)
    const dataAttributes = element.getAttributeNames().filter(name => name.startsWith('data-'));
    const hasTrackingData = dataAttributes.some(attr => 
      attr.includes('track') || attr.includes('analytics') || attr.includes('click')
    );
    
    if (hasTrackingData) {
      return true;
    }

    // 7. 텍스트 길이 기반 필터링 (너무 짧은 텍스트는 버튼일 가능성)
    const textContent = element.textContent?.trim() || '';
    if (textContent.length > 0 && textContent.length < 4) {
      // 3글자 이하의 짧은 텍스트는 버튼이나 라벨일 가능성
      const shortButtonTexts = ['edit', 'more', 'menu', 'close', 'ok', 'yes', 'no', 'add', 'new'];
      if (shortButtonTexts.includes(textContent.toLowerCase())) {
        return true;
      }
    }

    // 8. 부모 요소 확인 (2단계까지)
    let currentElement = element.parentElement;
    let depth = 0;
    
    while (currentElement && depth < 2) {
      const parentClass = (currentElement.className || '').toLowerCase();
      const parentId = (currentElement.id || '').toLowerCase();
      const parentRole = currentElement.getAttribute('role');
      
      // 부모가 제외 대상이면 자식도 제외
      if (excludedClasses.some(cls => parentClass.includes(cls)) ||
          excludedIds.some(id => parentId.includes(id)) ||
          (parentRole && excludedRoles.includes(parentRole.toLowerCase()))) {
        return true;
      }
      
      currentElement = currentElement.parentElement;
      depth++;
    }

    return false;
  }

  // 화면에 보이는 텍스트만 추출
  extractVisibleText() {
    const selectedElement = window.ttsSelector?.currentElement;
    if (!selectedElement) return '';

    const visibleTexts = [];
    
    // 모든 텍스트 노드를 찾아서 화면에 보이는지 확인
    const walker = document.createTreeWalker(
      selectedElement,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent.trim();
      if (text.length > 0) {
        // 텍스트 노드의 부모 요소가 화면에 보이는지 확인
        const parentElement = node.parentElement;
        if (parentElement && this.isElementVisible(parentElement)) {
          visibleTexts.push(text);
        }
      }
    }

    return visibleTexts.join(' ');
  }

  // 요소가 화면에 보이는지 확인
  isElementVisible(element) {
    // 요소가 존재하지 않으면 false
    if (!element) return false;

    // display: none 또는 visibility: hidden 체크
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    // opacity가 0이면 보이지 않음
    if (parseFloat(style.opacity) === 0) {
      return false;
    }

    // 요소의 크기가 0이면 보이지 않음
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }

    // 뷰포트 내에 있는지 확인
    const viewport = {
      top: 0,
      left: 0,
      bottom: window.innerHeight,
      right: window.innerWidth
    };

    // 요소가 뷰포트와 겹치는지 확인
    const isInViewport = !(
      rect.bottom < viewport.top ||
      rect.top > viewport.bottom ||
      rect.right < viewport.left ||
      rect.left > viewport.right
    );

    // 부분적으로라도 보이면 true
    return isInViewport;
  }

  // 언어 감지
  // 🎯 개선된 언어 감지 로직 (테이크별 감지 지원)
  async detectLanguage(text) {
    // 텍스트 정리 (공백, 숫자, 특수문자 제외하고 실제 문자만)
    const cleanText = text.replace(/[\s\d\p{P}]/gu, '');
    
    // 한글 패턴 (한글 자음, 모음, 완성형 한글)
    const koreanPattern = /[ㄱ-ㅎㅏ-ㅣ가-힣]/g;
    // 영문 패턴 (알파벳만)
    const englishPattern = /[a-zA-Z]/g;
    
    const koreanMatches = cleanText.match(koreanPattern) || [];
    const englishMatches = cleanText.match(englishPattern) || [];
    
    const koreanCount = koreanMatches.length;
    const englishCount = englishMatches.length;
    const totalLetters = koreanCount + englishCount;
    
    console.log(`언어 감지 분석: "${text.substring(0, 30)}..."`);
    console.log(`한글: ${koreanCount}자, 영문: ${englishCount}자, 전체: ${totalLetters}자`);
    
    // 텍스트가 너무 짧으면 기본값 한국어
    if (totalLetters < 5) {
      console.log('텍스트가 너무 짧음 → 기본값 한국어');
      return 'ko';
    }
    
    // 한글 비율 계산
    const koreanRatio = koreanCount / totalLetters;
    const englishRatio = englishCount / totalLetters;
    
    console.log(`한글 비율: ${(koreanRatio * 100).toFixed(1)}%, 영문 비율: ${(englishRatio * 100).toFixed(1)}%`);
    
    // 🎯 더 엄격한 언어 감지 기준
    if (koreanRatio >= 0.3) {  // 한글이 30% 이상이면 한국어
      console.log('→ 한국어로 감지');
      return 'ko';
    } else if (englishRatio >= 0.7) {  // 영문이 70% 이상이면 영어
      console.log('→ 영어로 감지');
      return 'en';
    } else if (koreanCount > englishCount) {  // 한글 문자수가 더 많으면 한국어
      console.log('→ 한글 문자수 우세로 한국어');
      return 'ko';
    } else {
      console.log('→ 기본값 한국어');
      return 'ko';
    }
  }

  // 테이크 생성 및 재생 (버퍼링 최적화)
  async generateAndPlayTake(takeIndex) {
    if (takeIndex >= this.takes.length) return;
    
    const take = this.takes[takeIndex];
    
    try {
      let audioUrl;
      
      // 🚀 이미 버퍼링된 경우 바로 재생
      if (this.audioBuffer[takeIndex]) {
        console.log(`테이크 ${takeIndex + 1} 버퍼에서 즉시 재생`);
        audioUrl = this.audioBuffer[takeIndex];
        this.updateStatus(`재생 중... (${takeIndex + 1}/${this.takes.length})`, '#4CAF50');
      } else {
        // 버퍼링되지 않은 경우에만 생성
        console.log(`테이크 ${takeIndex + 1} 실시간 생성 중...`);
        this.updateStatus(`음성 생성 중... (${takeIndex + 1}/${this.takes.length})`, '#FF9800');
        audioUrl = await this.convertToSpeech(take);
        this.audioBuffer[takeIndex] = audioUrl;
      }
      
      // 오디오 재생
      await this.playAudio(audioUrl, takeIndex);
      
    } catch (error) {
      console.error(`테이크 ${takeIndex + 1} 처리 실패:`, error);
      this.updateStatus('재생 실패', '#F44336');
    }
  }

  // 음성 변환
  async convertToSpeech(take) {
    const requestData = {
      text: take.text,
      voice_id: this.selectedVoice.id,
      language: take.language,
      style: this.selectedVoice.id === '6151a25f6a7f5b1e000023' ? 'excited' : 'neutral',
      model: 'sona_speech_1',
      voice_settings: {
        pitch_shift: 0,
        pitch_variance: 1,
        speed: 1
      }
    };

    console.log('TTS API 요청:', requestData);
    console.log('API URL:', `${this.apiUrl}/api/tts`);

    try {
      const response = await fetch(`${this.apiUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
        signal: this.abortController?.signal
      });

      console.log('API 응답 상태:', response.status);
      console.log('API 응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 오류 응답:', errorText);
        throw new Error(`TTS API 오류: ${response.status} - ${errorText}`);
      }

      const audioData = await response.arrayBuffer();
      console.log('받은 오디오 데이터 크기:', audioData.byteLength, 'bytes');
      
      if (audioData.byteLength === 0) {
        throw new Error('빈 오디오 데이터를 받았습니다.');
      }

      const blob = new Blob([audioData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      console.log('생성된 오디오 URL:', url);
      
      return url;
    } catch (error) {
      console.error('TTS 변환 상세 오류:', error);
      
      // 네트워크 오류인 경우
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('네트워크 연결 오류: API 서버에 접근할 수 없습니다.');
      }
      
      // CORS 오류인 경우
      if (error.message.includes('CORS')) {
        throw new Error('CORS 오류: 브라우저에서 API 접근이 차단되었습니다.');
      }
      
      throw error;
    }
  }

  // 오디오 재생
  async playAudio(audioUrl, takeIndex) {
    return new Promise((resolve, reject) => {
      this.currentAudio = new Audio(audioUrl);
      this.isPlaying = true;
      this.isPaused = false;
      
      this.updateStatus(`재생 중... (${takeIndex + 1}/${this.takes.length})`, '#4CAF50');
      
      // 오디오 메타데이터 로드 완료 시 단어 트래킹 시작
      this.currentAudio.onloadedmetadata = () => {
        console.log(`오디오 메타데이터 로드 완료 - 길이: ${this.currentAudio.duration}초`);
        this.startWordTracking(takeIndex);
      };
      
      this.currentAudio.onended = () => {
        this.isPlaying = false;
        console.log(`테이크 ${takeIndex} 재생 완료`);
        
        // 단어 트래킹 중지
        this.stopWordTracking();
        
        // 다음 테이크 재생 (즉시 또는 짧은 간격)
        if (takeIndex + 1 < this.takes.length) {
          this.currentTakeIndex = takeIndex + 1;
          
          // 🚀 버퍼링된 테이크는 즉시, 아니면 짧은 간격
          const nextTakeBuffered = this.audioBuffer[this.currentTakeIndex];
          const delay = nextTakeBuffered ? 50 : 200; // 버퍼링된 경우 50ms, 아니면 200ms
          
          console.log(`다음 테이크 ${this.currentTakeIndex + 1} ${nextTakeBuffered ? '버퍼링됨 (즉시)' : '생성 필요 (200ms 대기)'}`);
          
          setTimeout(() => {
            this.generateAndPlayTake(this.currentTakeIndex);
          }, delay);
          
          // 그 다음 테이크 미리 생성 (더 앞서서)
          for (let i = takeIndex + 2; i < Math.min(takeIndex + 5, this.takes.length); i++) {
            if (!this.audioBuffer[i]) {
              this.prepareNextTake(i);
            }
          }
        } else {
          // 모든 테이크 재생 완료
          this.updateStatus('재생 완료', '#4CAF50');
          setTimeout(() => this.hideUI(), 3000);
        }
        
        resolve();
      };
      
      this.currentAudio.onerror = (error) => {
        console.error('오디오 재생 오류:', error);
        this.updateStatus('재생 오류', '#F44336');
        this.stopWordTracking();
        reject(error);
      };
      
      // 진행률 업데이트 (안전한 duration 체크)
      this.currentAudio.ontimeupdate = () => {
        if (this.currentAudio && 
            this.currentAudio.duration && 
            !isNaN(this.currentAudio.duration) && 
            this.currentAudio.duration > 0) {
          
          const currentTime = this.currentAudio.currentTime || 0;
          const progress = (currentTime / this.currentAudio.duration) * 100;
          this.updateProgress(progress);
          
          // 단어 트래킹 업데이트
          this.updateWordTracking();
        }
      };
      
      this.currentAudio.play().catch(reject);
    });
  }

  // 단어 트래킹 시작
  startWordTracking(takeIndex) {
    const take = this.takes[takeIndex];
    if (!take) return;

    console.log(`=== 📍 새로운 단어 트래킹 시작 ===`);
    console.log(`테이크 ${takeIndex + 1}: "${take.text.substring(0, 50)}..."`);
    console.log(`테이크 요소 정보:`, take.elementInfo);

    // currentTakeIndex 동기화
    this.currentTakeIndex = takeIndex;

    // 🎯 테이크별 정확한 DOM 요소 사용
    const targetElement = take.elementInfo?.element;
    if (!targetElement) {
      console.error('테이크에 연결된 DOM 요소가 없음');
      return;
    }

    console.log(`트래킹 대상 요소: ${targetElement.tagName}.${targetElement.className} (${take.elementInfo.selector})`);

    // 🎯 해당 요소에서만 텍스트 추출 및 래핑
    this.wrapTakeWordsInSpecificElement(targetElement, take.text, takeIndex);

    // 현재 테이크의 텍스트만을 단어별로 분할
    this.currentTakeWords = take.text.split(/\s+/).filter(word => word.length > 0);
    this.currentTakeWordElements = [];
    
    console.log(`테이크 ${takeIndex + 1} 단어 트래킹 시작: ${this.currentTakeWords.length}개 단어`);
    
    // 🎯 UI 업데이트
    this.updateTakeInfo(takeIndex, this.takes.length);
    this.updateWordInfo(0, this.currentTakeWords.length, this.currentTakeWords[0] || '');
    this.updateHtmlViewer(targetElement, take.text);
    
    // 현재 테이크 텍스트와 일치하는 부분만 래핑
    this.wrapCurrentTakeWords(selectedElement, take.text);
  }

  // 🔍 최적의 컨테이너 요소 찾기 (캐시 활용)
  findBestContainerElement() {
    // 이미 컨테이너가 설정되어 있으면 재사용
    if (this.cachedContainer && document.contains(this.cachedContainer)) {
      console.log(`캐시된 컨테이너 재사용:`, this.cachedContainer.tagName, this.cachedContainer.className);
      return this.cachedContainer;
    }

    const originalElement = window.ttsSelector?.currentElement;
    if (!originalElement) return null;

    console.log(`새 컨테이너 탐색 시작. 원본 요소:`, originalElement.tagName, originalElement.className);

    // 1단계: 전체 텍스트가 포함된 가장 가까운 상위 요소 찾기
    let candidate = originalElement;
    let bestContainer = originalElement;
    let maxTextLength = 0;

    // 전체 테이크들의 합친 텍스트 (더 많은 키워드 사용)
    const allTakesText = this.takes.map(t => t.text).join(' ');
    const normalizedAllText = this.normalizeForMatching(allTakesText);
    const allTextWords = normalizedAllText.split(/\s+/).filter(w => w.length > 0);
    
    // 더 많은 키워드 샘플로 정확도 향상
    const keywordSamples = [
      allTextWords.slice(0, 15).join(' '),  // 첫 15단어
      allTextWords.slice(10, 25).join(' '), // 중간 15단어
      allTextWords.slice(-15).join(' ')     // 마지막 15단어
    ];
    
    console.log(`키워드 샘플들:`, keywordSamples.map(k => `"${k.substring(0, 30)}..."`));

    // 상위 요소들을 순회하면서 최적 컨테이너 찾기
    while (candidate && candidate !== document.body) {
      const candidateText = this.normalizeForMatching(candidate.textContent || '');
      
      // 모든 키워드 샘플 중 하나라도 포함되면 후보로 선정
      const hasKeywords = keywordSamples.some(sample => candidateText.includes(sample));
      
      if (hasKeywords && candidateText.length > maxTextLength) {
        bestContainer = candidate;
        maxTextLength = candidateText.length;
        console.log(`더 나은 컨테이너 발견:`, candidate.tagName, candidate.className, `길이: ${candidateText.length}`);
      }

      candidate = candidate.parentElement;
    }

    // 2단계: 너무 큰 요소는 피하고 적절한 범위로 제한
    const containerText = this.normalizeForMatching(bestContainer.textContent || '');
    
    if (containerText.length > normalizedAllText.length * 3) {
      console.log(`컨테이너가 너무 큼 (${containerText.length} vs ${normalizedAllText.length}). 하위 요소 탐색`);
      
      // 하위 요소 중에서 키워드를 포함하는 가장 작은 요소 찾기
      const children = Array.from(bestContainer.children);
      for (let child of children) {
        const childText = this.normalizeForMatching(child.textContent || '');
        const childHasKeywords = keywordSamples.some(sample => childText.includes(sample));
        
        if (childHasKeywords && childText.length < containerText.length) {
          console.log(`더 적절한 하위 컨테이너:`, child.tagName, child.className);
          bestContainer = child;
          break;
        }
      }
    }

    // 컨테이너 캐시
    this.cachedContainer = bestContainer;
    console.log(`최종 선택 및 캐시된 컨테이너:`, bestContainer.tagName, bestContainer.className);
    return bestContainer;
  }

  // 정규화 함수 (다른 곳에서도 사용할 수 있도록)
  normalizeForMatching(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // 🎯 특정 요소 내에서만 테이크 단어 래핑 (새로운 트래킹 로직)
  wrapTakeWordsInSpecificElement(targetElement, takeText, takeIndex) {
    console.log(`=== 특정 요소 내 단어 래핑 시작 ===`);
    console.log(`대상 요소: ${targetElement.tagName}.${targetElement.className}`);
    console.log(`테이크 텍스트: "${takeText.substring(0, 50)}..."`);
    
    // 이전 래핑 해제 (현재 테이크만)
    this.unwrapWords();
    
    // 대상 요소 내의 모든 텍스트 추출
    const elementText = this.extractAllTextFromElement(targetElement);
    const normalizedElementText = this.normalizeForMatching(elementText);
    const normalizedTakeText = this.normalizeForMatching(takeText);
    
    console.log(`요소 텍스트 길이: ${elementText.length}자`);
    console.log(`테이크 텍스트 길이: ${takeText.length}자`);
    
    // 테이크 텍스트가 요소 내에 있는지 확인
    const takeStartIndex = normalizedElementText.indexOf(normalizedTakeText.substring(0, Math.min(100, normalizedTakeText.length)));
    
    if (takeStartIndex === -1) {
      console.warn('요소 내에서 테이크 텍스트를 찾을 수 없음');
      return;
    }
    
    console.log(`테이크 시작 위치: ${takeStartIndex}`);
    
    // 🎯 요소 내 텍스트 노드들 수집
    const textNodes = [];
    const walker = document.createTreeWalker(
      targetElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // 텍스트 노드만 수집 (빈 텍스트 제외)
          if (node.textContent.trim().length > 0) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let textNode;
    while (textNode = walker.nextNode()) {
      textNodes.push(textNode);
    }
    
    console.log(`텍스트 노드 ${textNodes.length}개 발견`);
    
    // 🎯 테이크 범위에 해당하는 텍스트 노드만 래핑
    let currentIndex = 0;
    const takeEndIndex = takeStartIndex + normalizedTakeText.length;
    
    for (const textNode of textNodes) {
      const nodeText = textNode.textContent;
      const nodeNormalizedText = this.normalizeForMatching(nodeText);
      const nodeStartIndex = currentIndex;
      const nodeEndIndex = currentIndex + nodeNormalizedText.length;
      
      // 이 노드가 테이크 범위와 겹치는지 확인
      const overlapStart = Math.max(takeStartIndex, nodeStartIndex);
      const overlapEnd = Math.min(takeEndIndex, nodeEndIndex);
      
      if (overlapStart < overlapEnd) {
        // 겹치는 부분이 있으면 이 노드를 래핑
        console.log(`노드 래핑: "${nodeText.substring(0, 30)}..."`);
        this.wrapSingleTextNode(textNode);
      }
      
      currentIndex = nodeEndIndex + 1; // 공백 고려
    }
    
    console.log(`테이크 ${takeIndex + 1} 래핑 완료: ${this.currentTakeWordElements.length}개 단어`);
  }

  // 현재 테이크 텍스트와 일치하는 부분만 래핑 (정확한 범위로 제한) - 기존 로직
  wrapCurrentTakeWords(element, takeText) {
    console.log(`=== 테이크 ${this.currentTakeIndex + 1} 텍스트 래핑 시작 ===`);
    console.log(`테이크 텍스트: ${takeText.substring(0, 50)}...`);
    console.log(`테이크 길이: ${takeText.length}자`);
    
    // 이전 래핑 해제
    const beforeUnwrap = document.querySelectorAll('.tts-word, .tts-current-take').length;
    console.log(`래핑 해제 전 span 개수: ${beforeUnwrap}`);
    
    this.unwrapWords();
    
    const afterUnwrap = document.querySelectorAll('.tts-word, .tts-current-take').length;
    console.log(`래핑 해제 후 span 개수: ${afterUnwrap}`);
    
    // 원본 전체 텍스트 재구축 (이전 테이크들의 텍스트 포함)
    let originalFullText = '';
    for (let i = 0; i < this.takes.length; i++) {
      if (i > 0) originalFullText += ' '; // 테이크 간 구분
      originalFullText += this.takes[i].text;
    }
    
    // 현재 테이크의 시작 위치 계산
    let takeStartOffset = 0;
    for (let i = 0; i < this.currentTakeIndex; i++) {
      takeStartOffset += this.takes[i].text.length;
      if (i > 0) takeStartOffset += 1; // 테이크 간 구분 공백
    }
    
    const takeEndOffset = takeStartOffset + takeText.length;
    
    console.log(`원본 전체 텍스트 길이: ${originalFullText.length}`);
    console.log(`현재 테이크 오프셋: ${takeStartOffset} - ${takeEndOffset}`);
    console.log(`현재 테이크 원본 텍스트: "${originalFullText.substring(takeStartOffset, takeEndOffset)}"`);
    
    // DOM에서 텍스트 노드 수집
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.trim().length > 0) {
        textNodes.push(node);
      }
    }

    // DOM 텍스트와 원본 텍스트 매핑
    let domFullText = '';
    const nodeInfos = [];
    
    textNodes.forEach(textNode => {
      const nodeText = textNode.textContent;
      nodeInfos.push({
        node: textNode,
        text: nodeText,
        startIndex: domFullText.length,
        endIndex: domFullText.length + nodeText.length
      });
      domFullText += nodeText;
    });

    // 정규화된 텍스트로 매핑 (클래스 메서드 사용)
    const normalizedDomText = this.normalizeForMatching(domFullText);
    const normalizedOriginalText = this.normalizeForMatching(originalFullText);
    const normalizedTakeText = this.normalizeForMatching(takeText);
    
    console.log(`정규화된 DOM 텍스트 길이: ${normalizedDomText.length}`);
    console.log(`정규화된 원본 텍스트 길이: ${normalizedOriginalText.length}`);
    console.log(`DOM 텍스트 샘플: "${normalizedDomText.substring(0, 80)}..."`);
    console.log(`원본 텍스트 샘플: "${normalizedOriginalText.substring(0, 80)}..."`);
    
    // 🎯 직접 현재 테이크 매칭 (이전 테이크 건너뛰기)
    console.log(`현재 테이크 ${this.currentTakeIndex + 1} 직접 매칭 시작`);
    
    // 현재 테이크의 처음 5개 단어 추출 (정규화된 텍스트에서)
    const currentTakeWords = normalizedTakeText.split(/\s+/).filter(w => w.length > 0);
    const keyWords = currentTakeWords.slice(0, Math.min(5, currentTakeWords.length)).join(' ');
    
    console.log(`정규화된 테이크 텍스트: "${normalizedTakeText.substring(0, 100)}..."`);
    console.log(`키워드 (처음 5단어): "${keyWords}"`);
    
    // 🚀 개선: 이전에 찾은 위치부터 시작 (캐시 활용)
    let searchStartPos = 0;
    
    if (this.currentTakeIndex > 0 && this.lastTakeEndPosition !== undefined) {
      // 이전 테이크가 끝난 위치부터 검색 시작
      searchStartPos = this.lastTakeEndPosition;
      console.log(`이전 테이크 끝 위치부터 검색 시작: ${searchStartPos}`);
    } else {
      console.log(`첫 번째 테이크, 처음부터 검색`);
    }
    
    // 현재 테이크 키워드를 바로 찾기
    let takeStartIndex = normalizedDomText.indexOf(keyWords, searchStartPos);
    
    if (takeStartIndex === -1) {
      console.warn('키워드 매칭 실패. 전체 범위에서 재검색');
      
      // 3단계: 전체 텍스트에서 키워드의 모든 위치 찾기
      const allKeywordMatches = [];
      let pos = 0;
      while ((pos = normalizedDomText.indexOf(keyWords, pos)) !== -1) {
        allKeywordMatches.push(pos);
        pos += keyWords.length;
      }
      
      console.log(`키워드 "${keyWords}" 모든 매칭:`, allKeywordMatches);
      
      if (allKeywordMatches.length > this.currentTakeIndex) {
        takeStartIndex = allKeywordMatches[this.currentTakeIndex];
        console.log(`${this.currentTakeIndex}번째 키워드 매칭 사용: ${takeStartIndex}`);
      } else if (allKeywordMatches.length > 0) {
        // 키워드 매칭이 적으면 마지막 매칭 이후 위치 추정
        const lastMatch = allKeywordMatches[allKeywordMatches.length - 1];
        takeStartIndex = lastMatch + (this.currentTakeIndex - allKeywordMatches.length + 1) * 200; // 대략적 추정
        console.log(`추정 위치 사용: ${takeStartIndex}`);
      }
    }
    
    if (takeStartIndex === -1 || takeStartIndex >= normalizedDomText.length) {
      console.warn('키워드 매칭 완전 실패. 단어별 매칭 시도');
      
      // 4단계: 첫 번째 단어만으로 매칭
      const firstWord = currentTakeWords[0];
      if (firstWord && firstWord.length > 2) {
        takeStartIndex = normalizedDomText.indexOf(firstWord, Math.max(0, estimatedStartPos - 100));
        console.log(`첫 단어 "${firstWord}" 매칭 시도: ${takeStartIndex}`);
      }
      
      if (takeStartIndex === -1) {
        console.error('모든 매칭 방법 실패. 테이크 건너뛰기');
        console.log(`찾으려던 텍스트: "${normalizedTakeText.substring(0, 100)}..."`);
        console.log(`DOM 텍스트 샘플: "${normalizedDomText.substring(Math.max(0, estimatedStartPos - 50), estimatedStartPos + 150)}..."`);
        return;
      }
    }

    // 🎯 정확한 테이크 끝 위치 계산 (현재 테이크만)
    let takeEndIndex;
    
    // 1. 현재 테이크 텍스트 길이를 정확히 적용
    const maxTakeLength = normalizedTakeText.length;
    
    // 2. DOM에서 사용 가능한 텍스트 길이 확인
    const remainingDomLength = normalizedDomText.length - takeStartIndex;
    
    // 3. 둘 중 작은 값으로 끝 위치 설정 (안전하게)
    const safeTakeLength = Math.min(maxTakeLength, remainingDomLength);
    takeEndIndex = takeStartIndex + safeTakeLength;
    
    console.log(`테이크 시작: ${takeStartIndex}, 끝: ${takeEndIndex}, 길이: ${safeTakeLength}`);
    
    // 4. 다음 테이크 키워드 검사로 더 정확한 끝 위치 찾기
    if (this.currentTakeIndex + 1 < this.takes.length) {
      const nextTakeNormalized = this.normalizeForMatching(this.takes[this.currentTakeIndex + 1].text);
      const nextTakeWords = nextTakeNormalized.split(/\s+/).filter(w => w.length > 0);
      const nextKeyWords = nextTakeWords.slice(0, Math.min(3, nextTakeWords.length)).join(' ');
      
      // 현재 테이크 범위 내에서 다음 테이크 키워드 찾기
      const searchEndPos = Math.min(takeEndIndex + 50, normalizedDomText.length);
      const nextTakeStart = normalizedDomText.indexOf(nextKeyWords, takeStartIndex + keyWords.length);
      
      if (nextTakeStart !== -1 && nextTakeStart < searchEndPos) {
        // 다음 테이크가 너무 가까이 있으면 현재 테이크 끝을 조정
        takeEndIndex = Math.min(takeEndIndex, nextTakeStart);
        console.log(`다음 테이크로 인한 조정: ${takeEndIndex}`);
      }
    }
    
    // 매칭된 영역 확인
    const actualMatchedText = normalizedDomText.substring(takeStartIndex, takeEndIndex);
    console.log(`✅ 키워드 매칭 성공! 위치: ${takeStartIndex} - ${takeEndIndex}`);
    console.log(`키워드: "${keyWords}"`);
    console.log(`매칭 영역 (앞 50자): "${actualMatchedText.substring(0, 50)}..."`);
    
    // 키워드 기반 매칭이므로 엄격한 유사도 검사 생략
    const keywordMatch = actualMatchedText.includes(keyWords);
    if (!keywordMatch) {
      console.warn('키워드가 매칭 영역에 포함되지 않음');
      // 그래도 계속 진행 (위치 추정이 정확하지 않을 수 있음)
    }
    
    console.log(`실제 테이크 길이: ${normalizedTakeText.length}, 매칭 영역 길이: ${actualMatchedText.length}`);
    
    // 길이 차이가 너무 크면 조정
    if (Math.abs(actualMatchedText.length - normalizedTakeText.length) > normalizedTakeText.length * 0.5) {
      console.log('길이 차이가 큼. 원래 테이크 길이로 조정');
      takeEndIndex = takeStartIndex + normalizedTakeText.length;
      if (takeEndIndex > normalizedDomText.length) {
        takeEndIndex = normalizedDomText.length;
      }
    }

    // 🎯 테이크 끝 위치 캐시 (다음 테이크에서 사용)
    this.lastTakeEndPosition = takeEndIndex;
    console.log(`테이크 ${this.currentTakeIndex + 1} 끝 위치 캐시: ${takeEndIndex}`);

    // 테이크 범위에 해당하는 텍스트 노드들만 래핑
    this.wrapTextInRange(nodeInfos, takeStartIndex, takeEndIndex, normalizedDomText);
  }

  // 텍스트 유사도 계산 (0~1)
  calculateTextSimilarity(text1, text2) {
    if (text1 === text2) return 1;
    
    const minLen = Math.min(text1.length, text2.length);
    const maxLen = Math.max(text1.length, text2.length);
    
    if (minLen === 0) return 0;
    
    // 문자 단위 매칭 비율
    let matches = 0;
    for (let i = 0; i < minLen; i++) {
      if (text1[i] === text2[i]) {
        matches++;
      }
    }
    
    // 길이 차이 패널티 적용
    const lengthPenalty = minLen / maxLen;
    const charSimilarity = matches / minLen;
    
    return charSimilarity * lengthPenalty;
  }

  // 특정 범위의 텍스트만 래핑
  wrapTextInRange(nodeInfos, startIndex, endIndex, normalizedFullText) {
    let currentIndex = 0;
    
    nodeInfos.forEach(nodeInfo => {
      const nodeText = nodeInfo.text;
      const nodeNormalizedText = nodeText.replace(/\s+/g, ' ').trim();
      
      // 이 노드가 테이크 범위와 겹치는지 확인
      const nodeStartInNormalized = currentIndex;
      const nodeEndInNormalized = currentIndex + nodeNormalizedText.length;
      
      const overlapStart = Math.max(startIndex, nodeStartInNormalized);
      const overlapEnd = Math.min(endIndex, nodeEndInNormalized);
      
      if (overlapStart < overlapEnd) {
        // 겹치는 부분이 있으면 이 노드를 래핑
        this.wrapSingleTextNode(nodeInfo.node);
      }
      
      currentIndex = nodeEndInNormalized + 1; // 공백 고려
    });
  }

  // 단일 텍스트 노드 래핑 (현재 테이크 전용)
  wrapSingleTextNode(textNode) {
    const text = textNode.textContent;
    const words = text.split(/(\s+)/); // 공백도 보존
    
    if (words.length > 1) {
      const fragment = document.createDocumentFragment();
      
      words.forEach((word) => {
        if (word.trim().length > 0) {
          // 단어인 경우 span으로 감싸기
          const span = document.createElement('span');
          span.textContent = word;
          span.className = `tts-word tts-current-take tts-take-${this.currentTakeIndex}`;
          span.style.cssText = `
            transition: background-color 0.3s ease;
            padding: 1px 2px;
            border-radius: 2px;
          `;
          this.currentTakeWordElements.push(span);
          fragment.appendChild(span);
        } else {
          // 공백인 경우 그대로 추가
          fragment.appendChild(document.createTextNode(word));
        }
      });
      
      textNode.parentNode.replaceChild(fragment, textNode);
      console.log(`텍스트 노드 래핑 완료: ${words.filter(w => w.trim().length > 0).length}개 단어`);
    }
  }

  // 단어 트래킹 업데이트 (현재 테이크 기준)
  updateWordTracking() {
    // 안전성 체크 - 현재 테이크 기준으로 수정
    if (!this.currentAudio || 
        !this.currentTakeWordElements || 
        this.currentTakeWordElements.length === 0 ||
        !this.currentAudio.duration ||
        isNaN(this.currentAudio.duration) ||
        this.currentAudio.duration <= 0) {
      return;
    }

    const currentTime = this.currentAudio.currentTime || 0;
    const duration = this.currentAudio.duration;
    
    // 현재 재생 위치에 따른 단어 인덱스 계산 (현재 테이크 기준)
    const progress = Math.min(currentTime / duration, 1); // 1을 초과하지 않도록
    const wordIndex = Math.floor(progress * this.currentTakeWordElements.length);
    
    // 🎯 이전 하이라이트 제거 (CSS 클래스 기반)
    this.currentTakeWordElements.forEach(element => {
      if (element && element.classList) {
        element.classList.remove('tts-current-word');
      }
    });
    
    // 🎯 현재 단어 하이라이트 (개선된 버전)
    if (wordIndex >= 0 && wordIndex < this.currentTakeWordElements.length) {
      const currentWordElement = this.currentTakeWordElements[wordIndex];
      if (currentWordElement) {
        // CSS 클래스 기반 스타일링 사용
        currentWordElement.classList.add('tts-current-word');
        
        // 현재 단어로 스크롤 (부드럽게)
        try {
          currentWordElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        } catch (e) {
          // 스크롤 실패 시 무시
          console.log('스크롤 실패:', e);
        }
        
        // 🎯 UI 업데이트 - 현재 단어 정보
        const currentWord = this.currentTakeWords[wordIndex] || '';
        this.updateWordInfo(wordIndex + 1, this.currentTakeWords.length, currentWord);
      }
    }
    
    // 디버깅 정보 (현재 테이크 기준)
    if (wordIndex % 5 === 0) { // 5번째 단어마다 로그
      console.log(`현재 테이크 단어 트래킹: ${wordIndex}/${this.currentTakeWordElements.length} (${Math.round(progress * 100)}%)`);
    }
  }

  // 단어 트래킹 중지
  stopWordTracking() {
    if (this.currentTakeWordElements) {
      // 현재 테이크 단어들의 하이라이트 제거
      this.currentTakeWordElements.forEach(element => {
        if (element && element.style) {
          element.style.backgroundColor = '';
          element.style.color = '';
        }
      });
    }
  }

  // 단어 래핑 해제 (현재 테이크만)
  unwrapWords() {
    console.log(`unwrapWords 호출됨 - 테이크 ${this.currentTakeIndex}`);
    
    // 🎯 현재 테이크 전용 클래스로 정확한 해제
    const currentTakeSelector = `.tts-take-${this.currentTakeIndex}, .tts-current-take`;
    const wrappedWords = document.querySelectorAll(currentTakeSelector);
    console.log(`현재 테이크 래핑된 span 개수: ${wrappedWords.length}`);
    
    wrappedWords.forEach((span, index) => {
      const parent = span.parentNode;
      if (parent) {
        console.log(`테이크 ${this.currentTakeIndex} span ${index + 1} 해제: "${span.textContent}"`);
        parent.replaceChild(document.createTextNode(span.textContent), span);
        parent.normalize(); // 인접한 텍스트 노드들을 합치기
      }
    });
    
    // 배열 초기화
    this.currentTakeWordElements = [];
    this.currentTakeWords = [];
    
    // 해제 후 다시 확인 (현재 테이크만)
    const remainingCurrentSpans = document.querySelectorAll(currentTakeSelector);
    console.log(`현재 테이크 해제 후 남은 span 개수: ${remainingCurrentSpans.length}`);
    
    if (remainingCurrentSpans.length > 0) {
      console.warn(`경고: 현재 테이크의 span이 ${remainingCurrentSpans.length}개 남아있습니다.`);
      // 강제로 남은 현재 테이크 span들만 해제
      remainingCurrentSpans.forEach(span => {
        const parent = span.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(span.textContent), span);
          parent.normalize();
        }
      });
    }
    
    // 전체 span 상태 확인 (디버깅용)
    const allTTSSpans = document.querySelectorAll('.tts-word');
    console.log(`전체 TTS span 개수: ${allTTSSpans.length}`);
  }

  // 다음 테이크 미리 생성
  async prepareNextTake(takeIndex) {
    if (takeIndex >= this.takes.length || this.audioBuffer[takeIndex]) {
      return; // 이미 생성됨 또는 범위 초과
    }
    
    try {
      const take = this.takes[takeIndex];
      console.log(`테이크 ${takeIndex} 미리 생성 중...`);
      
      const audioUrl = await this.convertToSpeech(take);
      this.audioBuffer[takeIndex] = audioUrl;
      
      console.log(`테이크 ${takeIndex} 미리 생성 완료`);
    } catch (error) {
      console.error(`테이크 ${takeIndex} 미리 생성 실패:`, error);
    }
  }

  // 모든 재생 중지 및 초기화
  stopAll() {
    console.log('TTS 모든 재생 중지');
    
    // AbortController로 진행 중인 요청 중지
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    
    // 오디오 중지
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    // 단어 트래킹 중지 및 래핑 해제
    this.stopWordTracking();
    this.unwrapWords();
    
    // 상태 초기화
    this.isPlaying = false;
    this.isPaused = false;
    this.isGenerating = false;
    this.currentTakeIndex = 0;
    this.currentTakeWordElements = [];
    this.currentTakeWords = [];
    
    // 캐시 초기화
    this.lastTakeEndPosition = undefined;
    this.cachedContainer = null;
    
    // 버퍼 정리
    Object.values(this.audioBuffer).forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.audioBuffer = {};
    this.takes = [];
    
    // UI 업데이트
    this.updateStatus('중지됨', '#FF5722');
    this.updateProgress(0);
    
    setTimeout(() => this.hideUI(), 2000);
  }
}

// TTS Manager 전역 인스턴스 생성
window.ttsManager = new TTSManager();

console.log('TTS 모듈 로드 완료');
