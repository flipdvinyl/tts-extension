class TTSManager {
  constructor() {
    // 🎯 메모리 최적화: 디버깅 플래그
    this.DEBUG_MODE = false; // 프로덕션에서는 false로 설정
    
    // VOICES 배열 (audiobook-ui에서 가져옴)
    // 🎵 사용 가능한 음성 목록 (app.js와 동일)
    this.VOICES = [
      { name: '루시안 프로이드', id: 'hQqi26RFdZ59x3bGR2Bnoj', key: '1', description: `는 고독과 친밀한 화가였어요. 조용하지만 단단한 목소리로 마음을 전했죠. 한때, 프랜시스 베이컨의 절친이었다지요.` },
      { name: '귀찮은 고양이', id: 'ad67887f07639d2973f48a', key: '2', description: `를 소개하는 건 정말 너무 귀찮네요.` },
      { name: '책뚫남', id: 'a213ca3c004c21da52d35d', key: '3', description: `이 읽어 주는 책은 멈출 수 없어요. 잠들기 전 옆에서 책 읽어 주었으면 하는 사람 콘테스트에서 우승했거든요.` },
      { name: '제너레이션 MG', id: '4404f9613ff506ebd6daee', key: '4', description: `는 부장님을 이해할 수 없어요. 부장님도 그녀를 이해할 수 없지요. 그러면 어때요? 젊고 쿨한걸요.` },
      { name: '차분한 그녀', id: '26dbddbce9113c14a6822c', key: '5', description: `는 글을 읽으며 꾸미지 않아요. 가끔은 읽던 곳을 놓치기도 하지만, 그러면 어때요. 친근한걸요.` },
      { name: '미술관 도슨트', id: '0f7ccb849f108608620302', key: '6', description: `는 예술과 당신 사이의 안내자예요. 자연과 예술, 시간과 사유를 연결하는 자리에 늘 함께 있어요.` },
      { name: '박물관 사서', id: 'eb5e0f9308248300915305', key: '7', description: `눈에 띄지 않게 조용히 책 사이를 오가며, 누군가의 하루에 맞는 문장을 골라줘요.` },
      { name: '진지한 케일리', id: 'weKbNjMh2V5MuXziwHwjoT', key: '8', description: `는 회사 스튜디오에서 우연히 목소리를 녹음 했어요. 연기엔 자신 있었다지만 누가 봐도 또박또박 읽고 있지요.` },
      { name: 'Holy molly', id: '6151a25f6a7f5b1e000023', key: '9', description: `! 나 어메리칸이에요? K-POP 때문에 한국어가 조큼 배우기 시작했어요. 그래서 한국어는… 어… not perfect, but 영어는 완전 confident 있어요!` },
      { name: '릭 루빈', id: 'nNkPFG9fioPzmsxGpawKbv', key: '0', description: `은 화려한 테크닉보다 감각과 직관을 믿는 사람이에요. 명상으로 마음을 비우고, 음악의 본질만을 담아내는 전설적인 프로듀서죠.` },
      { name: '소년', id: '4MvvJLQnDUoBMojLQ8YhTW', key: null, description: `은 개울가 징검다리에서 소녀를 기다리고, 그녀가 건넌 흰 조약돌을 소중히 간직하는 조심스러운 아이예요.` },
      { name: '소녀', id: 'd1pREPnx17ahNcRvUfdhR8', key: null, description: `는 '이 바보'라며 웃으며 조약돌을 던지고, 수숫단 속에서 소년에게 몸을 기댄 채 조용히 따뜻함을 나누는 섬세한 아이예요.` },
      { name: '이석원', id: '6ay4URFxK9bry6z7zMDBLP', key: null, description: `은 말보다 침묵에 가까운 사람이지요. 그의 시선엔 쓸쓸함과 따뜻함이 함께 있고, 목소리는 그의 노래처럼 차분하고 조용하지만 오래 남거든요.` },
      { name: '출판사 『무제』 사장', id: 'k3nWGietavXL1CA7oksXZ9', key: null, description: `은 베일에 싸여 있어요. 배우라는 설도 있지만 낭설일 뿐이지요. 『쓸 만한 인간』이라는 말도 들어요.` },
      { name: '송골매 기타리스트', id: '9BxbNLZ349CPuYpLUmBDYa', key: null, description: `가 누구인지 아는사람들 모여라~! 세상만사 모든일이 뜻대로야 되겠소만 어쩌다 마주친 그대처럼 우리 모두 다 사랑하리~` }
    ];

    // 🎯 새로운 테이크 시스템 관련 상태
    this.preTakes = [];  // 사전 생성된 테이크 목록
    this.currentAudio = null;
    
    // 🎯 메모리 최적화: 스마트 오디오 버퍼 관리
    this.audioBuffer = new Map(); // Map으로 변경하여 순서 관리
    this.audioBufferTTL = new Map(); // TTL 관리
    this.MAX_AUDIO_CACHE = 5; // 최대 5개 오디오만 캐시
    this.CACHE_TTL = 300000; // 5분 TTL
    
    this.takes = [];
    this.currentTakeIndex = 0;
    this.currentPlayingTakeId = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.isGenerating = false;
    this.bufferingTakes = new Set(); // 버퍼링 중인 테이크들
    this.abortController = null;
    
    // 🎯 탭 간 동기화: 설정을 비동기로 불러오기 (기본값으로 초기화 후 업데이트)
    this.selectedVoice = this.VOICES[2]; // 기본값: 책뚫남
    this.playbackSpeed = 1.2; // 기본값: 1.2x
    
    // 비동기로 실제 설정 불러오기 (UI 업데이트 포함)
    this.loadSettingsAsync().then((settingsChanged) => {
      // 설정 로딩 완료 후 항상 UI 업데이트 (새 탭에서 동기화된 설정 표시)
      this.updateAllUIWithSettings();
    });
    this.minSpeed = 0.6;
    this.maxSpeed = 1.8;
    this.speedStep = 0.2;
    
    // 속도 선택 목록
    this.SPEED_OPTIONS = [
      { speed: 0.6, text: '정말 느리게' },
      { speed: 0.8, text: '조금 느리게' },
      { speed: 1.0, text: '보통 빠르기로' },
      { speed: 1.2, text: '조금 빠르게' },
      { speed: 1.4, text: '빠르게' },
      { speed: 1.6, text: '꽤 빠르게' },
      { speed: 1.8, text: '정말 빠르게' }
    ];
    
    // UI 폰트 크기 설정
    this.UI_FONT_SIZE = '16px';
    
    // 플러그인 활성화 상태
    this.isPluginEnabled = true;
    this.takeListVisible = true;
    this.floatingBarVisible = true;
    
    // API URL
    this.apiUrl = 'https://quiet-ink-groq.vercel.app';
    
    // 플로팅 UI 요소들
    this.floatingUI = null;
    this.statusLabel = null;
    this.takeInfoLabel = null;
    this.wordInfoLabel = null;
    this.htmlViewer = null;
    
    // 🎯 메모리 최적화: DOM 요소 참조 관리
    this.currentTakeWordElements = [];
    this.currentTakeWords = [];
    this.elementCache = new WeakMap(); // DOM 요소 캐시
    this.elementMetadata = new WeakSet(); // 처리된 요소 추적
    
    // 🎥 YouTube 아이콘 관련 초기화
    this.youtubeIcon = null;
    this.youtubeTitleObserver = null;
    this.youtubeIconMonitoringInterval = null;
    
    // 🤖 Zeta AI 화자 구분 시스템
    this.zetaAISpeaker1Voice = this.VOICES[7]; // 진지한 케일리 (인덱스 7)
    this.zetaAISpeaker2Voice = this.VOICES[3]; // 제너레이션 MG (인덱스 3)
    this.zetaAIEnterFlag = false; // 엔터키 입력 플래그 (true: 엔터키 입력됨, false: 엔터키 입력 안됨)
    this.zetaAICurrentSpeaker = 'speaker2'; // 현재 화자 (기본값: 화자2)
    
    // 🤖 Zeta AI: 순차 발화 큐 시스템
    this.zetaAISpeechQueue = []; // 발화 대기 큐
    this.zetaAIIsPlaying = false; // 현재 발화 중인지 여부
    this.zetaAICurrentAudio = null; // 현재 재생 중인 오디오
    
    // 🎯 페이지 로딩 완료 감지 및 초기화
    this.initializeWhenReady();
    
    // 🤖 Zeta AI: 포괄적 엔터키 감지 시스템 설정
    this.setupZetaAIEnterKeyDetection();
    
    // 🤖 Zeta AI: 캐릭터 선택 UI 생성
    this.createZetaAICharacterSelectionUI();
    
    // 🤖 Zeta AI: 3초 지연 후 테이크 감지 시작
    this.startZetaAIDelayedTakeDetection();
    
    // 🎥 YouTube 모드 즉시 확인 및 시작
    if (this.isYouTubeMode()) {
      this.log('🎥 YouTube 모드 즉시 감지됨 - YouTube 모드 시작');
      setTimeout(() => {
        this.startYouTubeMode();
      }, 1000); // 1초 후 시작
    }
    
    // 테마 감지 및 적용
    this.currentTheme = 'light'; // 기본값
    
    // 하단 플로팅 UI 생성 (제타 AI에서는 숨김)
    this.createBottomFloatingUI();
    
    // 🤖 Zeta AI / ChatGPT: 기존 하단 플로팅 UI 숨김
    if (this.isZetaOrChatGPTMode()) {
      this.hideBottomFloatingUIForZetaAI();
      this.hideAllFloatingUIForZetaAI();
    }
    
    // 테마 감지 후 UI 업데이트
    this.detectAndApplyTheme();
    
    // 백그라운드 스크립트 메시지 리스너 설정
    this.setupMessageListener();
    
    // 🎯 탭 간 설정 동기화: storage 변경 리스너 설정
    this.setupStorageListener();
    
    // 🎯 메모리 최적화: 주기적 캐시 정리 (1분마다)
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanExpiredAudioCache();
    }, 60000);
  }

  // 🎯 메모리 최적화: 조건부 로깅 헬퍼 메소드들
  log(...args) {
    if (this.DEBUG_MODE) console.log(...args);
  }

  warn(...args) {
    if (this.DEBUG_MODE) console.warn(...args);
  }

  error(...args) {
    if (this.DEBUG_MODE) console.error(...args);
  }

  // 🤖 Zeta AI / ChatGPT 모드 확인 헬퍼
  isZetaOrChatGPTMode() {
    return window.location.hostname.includes('zeta-ai') || window.location.hostname.includes('chatgpt_temp');
  }

  // 🎥 YouTube 모드 확인 헬퍼
  isYouTubeMode() {
    return window.location.hostname.includes('youtube.com') && window.location.pathname.includes('watch');
  }

  // 🎯 메모리 최적화: 스마트 오디오 버퍼 관리
  cleanExpiredAudioCache() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, timestamp] of this.audioBufferTTL.entries()) {
      if (now - timestamp > this.CACHE_TTL) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      this.removeFromAudioCache(key);
    }
    
    if (expiredKeys.length > 0) {
      this.log(`🧹 만료된 오디오 캐시 ${expiredKeys.length}개 정리 완료`);
    }
  }

  removeFromAudioCache(key) {
    if (this.audioBuffer.has(key)) {
      const audioUrl = this.audioBuffer.get(key);
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
      this.audioBuffer.delete(key);
      this.audioBufferTTL.delete(key);
    }
  }

  addToAudioCache(key, audioUrl) {
    // 캐시 크기 제한 확인
    if (this.audioBuffer.size >= this.MAX_AUDIO_CACHE) {
      // LRU: 가장 오래된 항목 제거
      const oldestKey = this.audioBuffer.keys().next().value;
      this.removeFromAudioCache(oldestKey);
    }
    
    // 새 항목 추가
    this.audioBuffer.set(key, audioUrl);
    this.audioBufferTTL.set(key, Date.now());
    
    this.log(`📦 오디오 캐시 추가: ${key} (총 ${this.audioBuffer.size}개)`);
  }

  getFromAudioCache(key) {
    if (this.audioBuffer.has(key)) {
      // 액세스 시 TTL 갱신 (LRU 효과)
      this.audioBufferTTL.set(key, Date.now());
      return this.audioBuffer.get(key);
    }
    return null;
  }

  // 📨 백그라운드 스크립트 메시지 리스너 설정
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggle') {
        this.togglePlugin(request.iconPosition);
        sendResponse({ success: true, enabled: this.isPluginEnabled });
      }
      return true; // 비동기 응답을 위해 true 반환
    });
  }

  // 🎯 탭 간 설정 동기화: storage 변경 리스너 설정
  setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync') {
        // 플러그인 활성화 설정이 다른 탭에서 변경됨
        if (changes['tts-plugin-enabled']) {
          const newEnabled = changes['tts-plugin-enabled'].newValue;
          if (newEnabled !== undefined && newEnabled !== this.isPluginEnabled) {
            this.isPluginEnabled = newEnabled;
            this.log(`🔄 다른 탭에서 플러그인 활성화 변경 감지: ${newEnabled ? 'ON' : 'OFF'}`);
            
            // UI 상태 업데이트
            if (newEnabled) {
              this.showUI();
            } else {
              this.hideUI();
            }
          }
        }
        
        // 화자 설정이 다른 탭에서 변경됨
        if (changes['tts-voice']) {
          const newVoiceData = changes['tts-voice'].newValue;
          if (newVoiceData) {
            const voice = this.VOICES.find(v => v.id === newVoiceData.id);
            if (voice && voice.id !== this.selectedVoice.id) {
              this.selectedVoice = voice;
              this.updateVoiceUI();
              this.log(`🔄 다른 탭에서 화자 변경 감지: ${voice.name}`);
            }
          }
        }
        
        // 속도 설정이 다른 탭에서 변경됨
        if (changes['tts-speed']) {
          const newSpeed = changes['tts-speed'].newValue;
          if (newSpeed && newSpeed !== this.playbackSpeed) {
            this.playbackSpeed = newSpeed;
            this.updateSpeedUI();
            this.log(`🔄 다른 탭에서 속도 변경 감지: ${newSpeed}x`);
          }
        }
        
        // 테이크 리스트 표시 설정이 다른 탭에서 변경됨
        if (changes['tts-take-list-visible']) {
          const newVisible = changes['tts-take-list-visible'].newValue;
          if (newVisible !== undefined && newVisible !== this.takeListVisible) {
            this.takeListVisible = newVisible;
            if (this.floatingUI && this.isPluginEnabled) {
              this.floatingUI.style.display = newVisible ? 'block' : 'none';
            }
            this.log(`🔄 다른 탭에서 테이크 리스트 표시 변경 감지: ${newVisible ? 'ON' : 'OFF'}`);
          }
        }
        
        // 플로팅바 표시 설정이 다른 탭에서 변경됨
        if (changes['tts-floating-bar-visible']) {
          const newVisible = changes['tts-floating-bar-visible'].newValue;
          if (newVisible !== undefined && newVisible !== this.floatingBarVisible) {
            this.floatingBarVisible = newVisible;
            if (this.bottomFloatingUI && this.isPluginEnabled) {
              this.bottomFloatingUI.style.display = newVisible ? 'block' : 'none';
            }
            this.log(`🔄 다른 탭에서 플로팅바 표시 변경 감지: ${newVisible ? 'ON' : 'OFF'}`);
          }
        }
        
        // 콘솔 로그 설정이 다른 탭에서 변경됨
        if (changes['tts-console-log-enabled']) {
          const newEnabled = changes['tts-console-log-enabled'].newValue;
          if (newEnabled !== undefined && newEnabled !== this.DEBUG_MODE) {
            this.DEBUG_MODE = newEnabled;
            this.updateConsoleLogStatus();
            this.log(`🔄 다른 탭에서 콘솔 로그 설정 변경 감지: ${newEnabled ? 'ON' : 'OFF'}`);
          }
        }
      }
    });
  }

  // 🔄 플러그인 on/off 토글
  togglePlugin(iconPosition = 'top-right') {
    // 플로팅 옵션 메뉴가 이미 열려있으면 닫기, 없으면 열기
    if (this.floatingOptionsMenu && document.body.contains(this.floatingOptionsMenu)) {
      this.removeFloatingOptionsMenu();
    } else {
      this.showFloatingOptionsMenu(iconPosition);
    }
  }

  // 🎛️ 플로팅 옵션 메뉴 표시
  showFloatingOptionsMenu(iconPosition = 'top-right') {
    // 기존 메뉴 제거
    this.removeFloatingOptionsMenu();
    
    // 테마별 색상 설정
    const isDark = this.currentTheme === 'dark';
    const bgColor = isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.6)' : '#1d1d1d';
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
    
    // 익스텐션 아이콘 바로 아래 위치 계산 (위로 25px 이동)
    const iconOffset = 25; // 아이콘에서 아래로 25px 떨어진 위치 (기존 50px에서 25px 위로)
    const menuPosition = iconPosition === 'top-right' ? {
      top: `${iconOffset}px`,
      right: '20px',
      left: 'auto'
    } : {
      top: `${iconOffset}px`,
      left: '20px',
      right: 'auto'
    };
    
    // 메뉴 컨테이너 생성
    this.floatingOptionsMenu = document.createElement('div');
    this.floatingOptionsMenu.id = 'tts-floating-options-menu';
    this.floatingOptionsMenu.style.cssText = `
      position: fixed !important;
      top: ${menuPosition.top} !important;
      left: ${menuPosition.left} !important;
      right: ${menuPosition.right} !important;
      background: ${bgColor} !important;
      color: ${textColor} !important;
      border: 1px solid ${borderColor} !important;
      border-radius: 12px !important;
      padding: 20px !important;
      min-width: 240px !important;
      z-index: 100001 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
      backdrop-filter: blur(10px) !important;
    `;
    
    // 제목
    const title = document.createElement('div');
    title.textContent = 'TLDRL';
    title.style.cssText = `
      font-weight: 600 !important;
      font-size: 16px !important;
      margin-bottom: 16px !important;
      text-align: left !important;
      color: ${textColor} !important;
    `;
    
    // 옵션 1: Enable the extension
    const enableOption = this.createToggleOption(
      'Enable the extension',
      this.isPluginEnabled,
      (enabled) => this.toggleExtensionEnabled(enabled),
      'enable-extension'
    );
    
    // 옵션 2: Take list (Enable the extension이 On일 때만 작동)
    const showTakeListOption = this.createToggleOption(
      'Take list',
      this.isPluginEnabled && this.takeListVisible,
      (enabled) => {
        if (this.isPluginEnabled) {
          this.toggleTakeListVisibility(enabled);
        }
      },
      'show-take-list'
    );
    
    // Enable the extension이 Off일 때 Show the take list 옵션 비활성화
    if (!this.isPluginEnabled) {
      showTakeListOption.style.opacity = '0.5';
      showTakeListOption.style.pointerEvents = 'none';
    }
    
    // 옵션 3: Floating bar
    const showFloatingToolbarOption = this.createToggleOption(
      'Floating bar',
      this.isPluginEnabled && this.floatingBarVisible,
      (enabled) => {
        if (this.isPluginEnabled) {
          this.toggleBottomFloatingToolbar(enabled);
        }
      },
      'show-floating-toolbar'
    );
    
    // Enable the extension이 Off일 때 Show the floating toolbar 옵션 비활성화
    if (!this.isPluginEnabled) {
      showFloatingToolbarOption.style.opacity = '0.5';
      showFloatingToolbarOption.style.pointerEvents = 'none';
    }
    
    // 옵션 4: Console log (기본 Off)
    const consoleLogOption = this.createToggleOption(
      'Console log',
      this.DEBUG_MODE,
      (enabled) => this.toggleConsoleLog(enabled),
      'console-log'
    );
    
    // 메뉴 조립
    this.floatingOptionsMenu.appendChild(title);
    this.floatingOptionsMenu.appendChild(enableOption);
    this.floatingOptionsMenu.appendChild(showFloatingToolbarOption);
    this.floatingOptionsMenu.appendChild(showTakeListOption);
    this.floatingOptionsMenu.appendChild(consoleLogOption);
    
    // 배경 클릭 시 메뉴 닫기 기능 제거 (외부 영역 클릭으로만 닫기)
    // this.floatingOptionsMenu.addEventListener('click', (e) => {
    //   if (e.target === this.floatingOptionsMenu) {
    //     this.removeFloatingOptionsMenu();
    //   }
    // });
    
    // 외부 영역 클릭 시 메뉴 닫기
    this.handleOutsideClick = (e) => {
      if (this.floatingOptionsMenu && !this.floatingOptionsMenu.contains(e.target)) {
        this.removeFloatingOptionsMenu();
      }
    };
    
    // 약간의 지연을 두어 현재 클릭 이벤트가 처리된 후 외부 클릭 감지 시작
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick);
    }, 100);
    
    // ESC 키로 메뉴 닫기
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        this.removeFloatingOptionsMenu();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
    
    document.body.appendChild(this.floatingOptionsMenu);
    this.log('🎛️ 플로팅 옵션 메뉴 표시');
  }

  // 🎛️ 토글 옵션 생성
  createToggleOption(label, isEnabled, onChange, optionType = '') {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      padding: 6px 0 !important;
    `;
    
    // 옵션 타입을 data 속성으로 추가
    if (optionType) {
      container.setAttribute('data-option', optionType);
    }
    
    // 라벨
    const labelElement = document.createElement('span');
    labelElement.textContent = label;
    labelElement.style.cssText = `
      color: ${this.currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#1d1d1d'} !important;
      font-size: 14px !important;
    `;
    
    // 토글 스위치
    const toggle = document.createElement('div');
    toggle.style.cssText = `
      width: 44px !important;
      height: 24px !important;
      background: ${isEnabled ? '#227cff' : 'rgba(125, 125, 125, 0.3)'} !important;
      border-radius: 12px !important;
      position: relative !important;
      cursor: pointer !important;
      transition: background 0.2s ease !important;
    `;
    
    // 토글 핸들
    const handle = document.createElement('div');
    handle.style.cssText = `
      width: 20px !important;
      height: 20px !important;
      background: white !important;
      border-radius: 50% !important;
      position: absolute !important;
      top: 2px !important;
      left: ${isEnabled ? '22px' : '2px'} !important;
      transition: left 0.2s ease !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
    `;
    
    toggle.appendChild(handle);
    
    // 토글 상태를 내부적으로 추적
    let currentState = isEnabled;
    
    // 클릭 이벤트
    toggle.addEventListener('click', () => {
      const newState = !currentState;
      currentState = newState;
      onChange(newState);
      
      // 토글 상태 업데이트
      toggle.style.background = newState ? '#227cff' : 'rgba(125, 125, 125, 0.3)';
      handle.style.left = newState ? '22px' : '2px';
    });
    
    container.appendChild(labelElement);
    container.appendChild(toggle);
    
    return container;
  }

  // 🎛️ 익스텐션 활성화/비활성화 토글
  toggleExtensionEnabled(enabled) {
    this.isPluginEnabled = enabled;
    
    // 설정 저장
    this.savePluginEnabledSetting(enabled);
    
    if (enabled) {
      this.log('🟢 TTS 플러그인 활성화');
      this.showUI();
      if (this.bottomFloatingUI) {
        this.bottomFloatingUI.style.display = 'block';
      }
    } else {
      this.log('🔴 TTS 플러그인 비활성화');
      this.stopAll();
      this.hideUI();
      if (this.bottomFloatingUI) {
        this.bottomFloatingUI.style.display = 'none';
      }
      this.hideTakeHoverIcon();
      this.removeYouTubeIcon();
      this.removeAllHighlights();
      
      // Enable the extension이 Off일 때 Show the take list와 floating toolbar도 자동으로 Off
      if (this.floatingUI) {
        this.floatingUI.style.display = 'none';
      }
      if (this.bottomFloatingUI) {
        this.bottomFloatingUI.style.display = 'none';
      }
    }
    
    // 백그라운드 스크립트에 아이콘 업데이트 요청
    chrome.runtime.sendMessage({ 
      action: 'updateIcon', 
      enabled: this.isPluginEnabled 
    });
    
    // 플로팅 옵션 메뉴가 열려있다면 옵션 상태 업데이트
    if (this.floatingOptionsMenu) {
      // Show the take list 옵션 업데이트
      const showTakeListOption = this.floatingOptionsMenu.querySelector('[data-option="show-take-list"]');
      if (showTakeListOption) {
        if (!enabled) {
          showTakeListOption.style.opacity = '0.5';
          showTakeListOption.style.pointerEvents = 'none';
        } else {
          showTakeListOption.style.opacity = '1';
          showTakeListOption.style.pointerEvents = 'auto';
        }
      }
      
      // Show the floating toolbar 옵션 업데이트
      const showFloatingToolbarOption = this.floatingOptionsMenu.querySelector('[data-option="show-floating-toolbar"]');
      if (showFloatingToolbarOption) {
        if (!enabled) {
          showFloatingToolbarOption.style.opacity = '0.5';
          showFloatingToolbarOption.style.pointerEvents = 'none';
        } else {
          showFloatingToolbarOption.style.opacity = '1';
          showFloatingToolbarOption.style.pointerEvents = 'auto';
        }
      }
      
      // Console log 옵션 업데이트
      const consoleLogOption = this.floatingOptionsMenu.querySelector('[data-option="console-log"]');
      if (consoleLogOption) {
        if (!enabled) {
          consoleLogOption.style.opacity = '0.5';
          consoleLogOption.style.pointerEvents = 'none';
        } else {
          consoleLogOption.style.opacity = '1';
          consoleLogOption.style.pointerEvents = 'auto';
        }
      }
    }
    
    this.log(`🔄 플러그인 상태: ${this.isPluginEnabled ? '활성화' : '비활성화'}`);
  }

  // 🎛️ 테이크 리스트 표시/숨김 토글
  toggleTakeListVisibility(enabled) {
    this.takeListVisible = enabled;
    
    if (this.floatingUI) {
      this.floatingUI.style.display = enabled ? 'block' : 'none';
      this.log(`🎛️ 테이크 리스트 ${enabled ? '표시' : '숨김'}`);
    }
    
    // 설정 저장
    this.saveTakeListVisibilitySetting(enabled);
  }

  // 🎛️ 하단 플로팅바 표시/숨김 토글
  toggleBottomFloatingToolbar(enabled) {
    this.floatingBarVisible = enabled;
    
    if (this.bottomFloatingUI) {
      this.bottomFloatingUI.style.display = enabled ? 'block' : 'none';
      this.log(`🎛️ 하단 플로팅바 ${enabled ? '표시' : '숨김'}`);
    }
    
    // 설정 저장
    this.saveFloatingBarVisibilitySetting(enabled);
  }

  // 🎛️ 콘솔 로그 표시/숨김 토글
  toggleConsoleLog(enabled) {
    this.DEBUG_MODE = enabled;
    
    // HTML 분석 모듈들의 DEBUG_MODE도 함께 제어
    if (window.htmlAnalyzerCommon) {
      window.htmlAnalyzerCommon.DEBUG_MODE = enabled;
    }
    if (window.htmlAnalyzerSites) {
      window.htmlAnalyzerSites.DEBUG_MODE = enabled;
    }
    
    // UI 상태 업데이트
    this.updateConsoleLogStatus();
    
    // 설정 저장
    this.saveConsoleLogSetting(enabled);
    
    // DEBUG_MODE 변경은 항상 console.log로 출력 (사용자 피드백)
    console.log(`🎛️ 콘솔 로그 ${enabled ? '활성화' : '비활성화'} - 메모리 및 성능 최적화`);
  }

  // 🎛️ 플로팅 옵션 메뉴 제거
  removeFloatingOptionsMenu() {
    if (this.floatingOptionsMenu) {
      this.floatingOptionsMenu.remove();
      this.floatingOptionsMenu = null;
      this.log('🎛️ 플로팅 옵션 메뉴 제거');
    }
    
    // 외부 클릭 이벤트 리스너 정리
    document.removeEventListener('click', this.handleOutsideClick);
  }

  // 🧹 모든 하이라이트 제거
  removeAllHighlights() {
    // 기존 App.js 스타일 단어 하이라이트 제거
    const existingHighlights = document.querySelectorAll('.tts-current-word-appjs');
    existingHighlights.forEach(highlight => {
      highlight.classList.remove('tts-current-word-appjs');
    });

    // 오버레이 하이라이트 제거
    const overlayHighlight = document.getElementById('tts-overlay-highlight');
    if (overlayHighlight) {
      overlayHighlight.remove();
    }
    
    // 테이크 호버 아이콘 제거
    this.hideTakeHoverIcon();
    
    // 🎥 YouTube 아이콘 제거
    this.removeYouTubeIcon();
    
    // 플로팅 옵션 메뉴는 제거하지 않음 (Enable the extension이 Off일 때도 메뉴는 남겨둠)
    // this.removeFloatingOptionsMenu();
  }
  
  // 🎥 YouTube 아이콘 제거
  removeYouTubeIcon() {
    if (this.youtubeIcon) {
      this.youtubeIcon.remove();
      this.youtubeIcon = null;
      this.log('🎥 YouTube: 아이콘 제거됨');
    }
    
    if (this.youtubeTitleObserver) {
      this.youtubeTitleObserver.disconnect();
      this.youtubeTitleObserver = null;
      this.log('🎥 YouTube: 제목 감지 옵저버 제거됨');
    }
    
    if (this.youtubeIconMonitoringInterval) {
      clearInterval(this.youtubeIconMonitoringInterval);
      this.youtubeIconMonitoringInterval = null;
      this.log('🎥 YouTube: 아이콘 모니터링 제거됨');
    }
  }

  // 🎯 탭 간 동기화: Chrome storage API 기반 플러그인 활성화 설정 저장
  async savePluginEnabledSetting(enabled) {
    try {
      await chrome.storage.sync.set({ 'tts-plugin-enabled': enabled });
      this.log(`💾 플러그인 활성화 설정 저장 (모든 탭 동기화): ${enabled ? 'ON' : 'OFF'}`);
      
      // 백업용 localStorage도 저장
      localStorage.setItem('tts-extension-plugin-enabled', JSON.stringify(enabled));
    } catch (error) {
      this.warn('플러그인 활성화 설정 저장 실패:', error);
      // Chrome storage 실패 시 localStorage로 폴백
      try {
        localStorage.setItem('tts-extension-plugin-enabled', JSON.stringify(enabled));
      } catch (localError) {
        this.error('localStorage 백업도 실패:', localError);
      }
    }
  }

  // 🎯 탭 간 동기화: Chrome storage API 기반 테이크 리스트 표시 설정 저장
  async saveTakeListVisibilitySetting(enabled) {
    try {
      await chrome.storage.sync.set({ 'tts-take-list-visible': enabled });
      this.log(`💾 테이크 리스트 표시 설정 저장 (모든 탭 동기화): ${enabled ? 'ON' : 'OFF'}`);
      
      // 백업용 localStorage도 저장
      localStorage.setItem('tts-extension-take-list-visible', JSON.stringify(enabled));
    } catch (error) {
      this.warn('테이크 리스트 표시 설정 저장 실패:', error);
      // Chrome storage 실패 시 localStorage로 폴백
      try {
        localStorage.setItem('tts-extension-take-list-visible', JSON.stringify(enabled));
      } catch (localError) {
        this.error('localStorage 백업도 실패:', localError);
      }
    }
  }

  // 🎯 탭 간 동기화: Chrome storage API 기반 플로팅바 표시 설정 저장
  async saveFloatingBarVisibilitySetting(enabled) {
    try {
      await chrome.storage.sync.set({ 'tts-floating-bar-visible': enabled });
      this.log(`💾 플로팅바 표시 설정 저장 (모든 탭 동기화): ${enabled ? 'ON' : 'OFF'}`);
      
      // 백업용 localStorage도 저장
      localStorage.setItem('tts-extension-floating-bar-visible', JSON.stringify(enabled));
    } catch (error) {
      this.warn('플로팅바 표시 설정 저장 실패:', error);
      // Chrome storage 실패 시 localStorage로 폴백
      try {
        localStorage.setItem('tts-extension-floating-bar-visible', JSON.stringify(enabled));
      } catch (localError) {
        this.error('localStorage 백업도 실패:', localError);
      }
    }
  }

  // 🎯 탭 간 동기화: Chrome storage API 기반 콘솔 로그 설정 저장
  async saveConsoleLogSetting(enabled) {
    try {
      await chrome.storage.sync.set({ 'tts-console-log-enabled': enabled });
      this.log(`💾 콘솔 로그 설정 저장 (모든 탭 동기화): ${enabled ? 'ON' : 'OFF'}`);
      
      // 백업용 localStorage도 저장
      localStorage.setItem('tts-extension-console-log-enabled', JSON.stringify(enabled));
    } catch (error) {
      this.warn('콘솔 로그 설정 저장 실패:', error);
      // Chrome storage 실패 시 localStorage로 폴백
      try {
        localStorage.setItem('tts-extension-console-log-enabled', JSON.stringify(enabled));
      } catch (localError) {
        this.error('localStorage 백업도 실패:', localError);
      }
    }
  }

  // 🎯 탭 간 동기화: Chrome storage API 기반 화자 설정 저장
  async saveVoiceSetting(voice) {
    try {
      const voiceData = {
        id: voice.id,
        name: voice.name,
        key: voice.key
      };
      
      await chrome.storage.sync.set({ 'tts-voice': voiceData });
      this.log(`💾 화자 설정 저장 (모든 탭 동기화): ${voice.name}`);
      
      // 백업용 localStorage도 저장
      localStorage.setItem('tts-extension-voice', JSON.stringify(voiceData));
    } catch (error) {
      this.warn('화자 설정 저장 실패:', error);
      // Chrome storage 실패 시 localStorage로 폴백
      try {
        localStorage.setItem('tts-extension-voice', JSON.stringify({
          id: voice.id,
          name: voice.name,
          key: voice.key
        }));
      } catch (localError) {
        this.error('localStorage 백업도 실패:', localError);
      }
    }
  }

  // 🎯 탭 간 동기화: Chrome storage API 우선 플러그인 활성화 설정 불러오기
  async loadPluginEnabledSetting() {
    return new Promise((resolve) => {
      try {
        // Chrome storage 우선 시도 (콜백 방식)
        chrome.storage.sync.get(['tts-plugin-enabled'], (result) => {
          if (result['tts-plugin-enabled'] !== undefined) {
            const enabled = result['tts-plugin-enabled'];
            this.log(`💾 플러그인 활성화 설정 불러오기 (Chrome storage): ${enabled ? 'ON' : 'OFF'}`);
            resolve(enabled);
            return;
          }
          
          // Chrome storage에 없으면 localStorage 백업 시도
          try {
            const localEnabled = localStorage.getItem('tts-extension-plugin-enabled');
            if (localEnabled !== null) {
              const enabled = JSON.parse(localEnabled);
              this.log(`💾 플러그인 활성화 설정 불러오기 (localStorage 백업): ${enabled ? 'ON' : 'OFF'}`);
              resolve(enabled);
              return;
            }
          } catch (error) {
            this.warn('localStorage 불러오기도 실패:', error);
          }
          
          // 기본값 사용
          this.log('기본 플러그인 활성화 설정 사용: ON');
          resolve(true); // 기본값: 활성화
        });
      } catch (error) {
        this.warn('Chrome storage 불러오기 실패, localStorage로 폴백:', error);
        
        // localStorage 백업 시도
        try {
          const localEnabled = localStorage.getItem('tts-extension-plugin-enabled');
          if (localEnabled !== null) {
            const enabled = JSON.parse(localEnabled);
            this.log(`💾 플러그인 활성화 설정 불러오기 (localStorage): ${enabled ? 'ON' : 'OFF'}`);
            resolve(enabled);
            return;
          }
        } catch (localError) {
          this.warn('localStorage 불러오기도 실패:', localError);
        }
        
        // 기본값 사용
        this.log('기본 플러그인 활성화 설정 사용: ON');
        resolve(true); // 기본값: 활성화
      }
    });
  }

  // 🎯 탭 간 동기화: Chrome storage API 우선 테이크 리스트 표시 설정 불러오기
  async loadTakeListVisibilitySetting() {
    return new Promise((resolve) => {
      try {
        // Chrome storage 우선 시도 (콜백 방식)
        chrome.storage.sync.get(['tts-take-list-visible'], (result) => {
          if (result['tts-take-list-visible'] !== undefined) {
            const enabled = result['tts-take-list-visible'];
            this.log(`💾 테이크 리스트 표시 설정 불러오기 (Chrome storage): ${enabled ? 'ON' : 'OFF'}`);
            resolve(enabled);
            return;
          }
          
          // Chrome storage에 없으면 localStorage 백업 시도
          try {
            const localEnabled = localStorage.getItem('tts-extension-take-list-visible');
            if (localEnabled !== null) {
              const enabled = JSON.parse(localEnabled);
              this.log(`💾 테이크 리스트 표시 설정 불러오기 (localStorage 백업): ${enabled ? 'ON' : 'OFF'}`);
              resolve(enabled);
              return;
            }
          } catch (error) {
            this.warn('localStorage 불러오기도 실패:', error);
          }
          
          // 기본값 사용
          this.log('기본 테이크 리스트 표시 설정 사용: ON');
          resolve(true); // 기본값: 표시
        });
      } catch (error) {
        this.warn('Chrome storage 불러오기 실패, localStorage로 폴백:', error);
        
        // localStorage 백업 시도
        try {
          const localEnabled = localStorage.getItem('tts-extension-take-list-visible');
          if (localEnabled !== null) {
            const enabled = JSON.parse(localEnabled);
            this.log(`💾 테이크 리스트 표시 설정 불러오기 (localStorage): ${enabled ? 'ON' : 'OFF'}`);
            resolve(enabled);
            return;
          }
        } catch (localError) {
          this.warn('localStorage 불러오기도 실패:', localError);
        }
        
        // 기본값 사용
        this.log('기본 테이크 리스트 표시 설정 사용: ON');
        resolve(true); // 기본값: 표시
      }
    });
  }

  // 🎯 탭 간 동기화: Chrome storage API 우선 플로팅바 표시 설정 불러오기
  async loadFloatingBarVisibilitySetting() {
    return new Promise((resolve) => {
      try {
        // Chrome storage 우선 시도 (콜백 방식)
        chrome.storage.sync.get(['tts-floating-bar-visible'], (result) => {
          if (result['tts-floating-bar-visible'] !== undefined) {
            const enabled = result['tts-floating-bar-visible'];
            this.log(`💾 플로팅바 표시 설정 불러오기 (Chrome storage): ${enabled ? 'ON' : 'OFF'}`);
            resolve(enabled);
            return;
          }
          
          // Chrome storage에 없으면 localStorage 백업 시도
          try {
            const localEnabled = localStorage.getItem('tts-extension-floating-bar-visible');
            if (localEnabled !== null) {
              const enabled = JSON.parse(localEnabled);
              this.log(`💾 플로팅바 표시 설정 불러오기 (localStorage 백업): ${enabled ? 'ON' : 'OFF'}`);
              resolve(enabled);
              return;
            }
          } catch (error) {
            this.warn('localStorage 불러오기도 실패:', error);
          }
          
          // 기본값 사용
          this.log('기본 플로팅바 표시 설정 사용: ON');
          resolve(true); // 기본값: 표시
        });
      } catch (error) {
        this.warn('Chrome storage 불러오기 실패, localStorage로 폴백:', error);
        
        // localStorage 백업 시도
        try {
          const localEnabled = localStorage.getItem('tts-extension-floating-bar-visible');
          if (localEnabled !== null) {
            const enabled = JSON.parse(localEnabled);
            this.log(`💾 플로팅바 표시 설정 불러오기 (localStorage): ${enabled ? 'ON' : 'OFF'}`);
            resolve(enabled);
            return;
          }
        } catch (localError) {
          this.warn('localStorage 불러오기도 실패:', localError);
        }
        
        // 기본값 사용
        this.log('기본 플로팅바 표시 설정 사용: ON');
        resolve(true); // 기본값: 표시
      }
    });
  }

  // 🎯 탭 간 동기화: Chrome storage API 우선 콘솔 로그 설정 불러오기
  async loadConsoleLogSetting() {
    return new Promise((resolve) => {
      try {
        // Chrome storage 우선 시도 (콜백 방식)
        chrome.storage.sync.get(['tts-console-log-enabled'], (result) => {
          if (result['tts-console-log-enabled'] !== undefined) {
            const enabled = result['tts-console-log-enabled'];
            this.log(`💾 콘솔 로그 설정 불러오기 (Chrome storage): ${enabled ? 'ON' : 'OFF'}`);
            resolve(enabled);
            return;
          }
          
          // Chrome storage에 없으면 localStorage 백업 시도
          try {
            const localEnabled = localStorage.getItem('tts-extension-console-log-enabled');
            if (localEnabled !== null) {
              const enabled = JSON.parse(localEnabled);
              this.log(`💾 콘솔 로그 설정 불러오기 (localStorage 백업): ${enabled ? 'ON' : 'OFF'}`);
              resolve(enabled);
              return;
            }
          } catch (error) {
            this.warn('localStorage 불러오기도 실패:', error);
          }
          
          // 기본값 사용
          this.log('기본 콘솔 로그 설정 사용: OFF');
          resolve(false); // 기본값: 비활성화
        });
      } catch (error) {
        this.warn('Chrome storage 불러오기 실패, localStorage로 폴백:', error);
        
        // localStorage 백업 시도
        try {
          const localEnabled = localStorage.getItem('tts-extension-console-log-enabled');
          if (localEnabled !== null) {
            const enabled = JSON.parse(localEnabled);
            this.log(`💾 콘솔 로그 설정 불러오기 (localStorage): ${enabled ? 'ON' : 'OFF'}`);
            resolve(enabled);
            return;
          }
        } catch (localError) {
          this.warn('localStorage 불러오기도 실패:', localError);
        }
        
        // 기본값 사용
        this.log('기본 콘솔 로그 설정 사용: OFF');
        resolve(false); // 기본값: 비활성화
      }
    });
  }

  // 🎯 탭 간 동기화: Chrome storage API 우선 화자 설정 불러오기
  async loadVoiceSetting() {
    return new Promise((resolve) => {
      try {
        // Chrome storage 우선 시도 (콜백 방식)
        chrome.storage.sync.get(['tts-voice'], (result) => {
          if (result['tts-voice']) {
            const voiceData = result['tts-voice'];
            const voice = this.VOICES.find(v => v.id === voiceData.id);
            if (voice) {
              this.log(`💾 화자 설정 불러오기 (Chrome storage): ${voice.name}`);
              resolve(voice);
              return;
            }
          }
          
          // Chrome storage 실패 시 localStorage 폴백
          try {
            const saved = localStorage.getItem('tts-extension-voice');
            if (saved) {
              const voiceData = JSON.parse(saved);
              const voice = this.VOICES.find(v => v.id === voiceData.id);
              if (voice) {
                this.log(`💾 화자 설정 불러오기 (localStorage 백업): ${voice.name}`);
                // Chrome storage에도 동기화
                chrome.storage.sync.set({ 'tts-voice': voiceData }).catch(() => {});
                resolve(voice);
                return;
              }
            }
          } catch (error) {
            this.warn('localStorage 불러오기도 실패:', error);
          }
          
          // 기본값: 책뚫남
          this.log('기본 화자 사용: 책뚫남');
          resolve(this.VOICES[2]);
        });
      } catch (error) {
        this.warn('Chrome storage 불러오기 실패, localStorage로 폴백:', error);
        // 에러 시 기본값 반환
        resolve(this.VOICES[2]);
      }
    });
  }

  // 🎯 탭 간 동기화: Chrome storage API 기반 속도 설정 저장
  async saveSpeedSetting(speed) {
    try {
      await chrome.storage.sync.set({ 'tts-speed': speed });
      this.log(`💾 속도 설정 저장 (모든 탭 동기화): ${speed}x`);
      
      // 백업용 localStorage도 저장
      localStorage.setItem('tts-extension-speed', speed.toString());
    } catch (error) {
      this.warn('속도 설정 저장 실패:', error);
      // Chrome storage 실패 시 localStorage로 폴백
      try {
        localStorage.setItem('tts-extension-speed', speed.toString());
      } catch (localError) {
        this.error('localStorage 속도 저장도 실패:', localError);
      }
    }
  }

  // 🎯 탭 간 동기화: Chrome storage API 우선 속도 설정 불러오기
  async loadSpeedSetting() {
    return new Promise((resolve) => {
      try {
        // Chrome storage 우선 시도 (콜백 방식)
        chrome.storage.sync.get(['tts-speed'], (result) => {
          if (result['tts-speed']) {
            const speed = parseFloat(result['tts-speed']);
            if (speed >= this.minSpeed && speed <= this.maxSpeed) {
              this.log(`💾 속도 설정 불러오기 (Chrome storage): ${speed}x`);
              resolve(speed);
              return;
            }
          }
          
          // Chrome storage 실패 시 localStorage 폴백
          try {
            const saved = localStorage.getItem('tts-extension-speed');
            if (saved) {
              const speed = parseFloat(saved);
              if (speed >= this.minSpeed && speed <= this.maxSpeed) {
                this.log(`💾 속도 설정 불러오기 (localStorage 백업): ${speed}x`);
                // Chrome storage에도 동기화
                chrome.storage.sync.set({ 'tts-speed': speed }).catch(() => {});
                resolve(speed);
                return;
              }
            }
          } catch (error) {
            this.warn('localStorage 속도 불러오기도 실패:', error);
          }
          
          // 기본값: 1.2
          this.log('기본 속도 사용: 1.2x');
          resolve(1.2);
        });
      } catch (error) {
        this.warn('Chrome storage 속도 불러오기 실패, localStorage로 폴백:', error);
        // 에러 시 기본값 반환
        resolve(1.2);
      }
    });
  }

  // 🎯 탭 간 동기화: 비동기 설정 로딩
  async loadSettingsAsync() {
    try {
      let settingsChanged = false;
      
      // 플러그인 활성화 설정 로딩
      const pluginEnabled = await this.loadPluginEnabledSetting();
      if (pluginEnabled !== this.isPluginEnabled) {
        this.isPluginEnabled = pluginEnabled;
        settingsChanged = true;
        this.log(`🎯 플러그인 활성화 설정 로딩: ${pluginEnabled ? 'ON' : 'OFF'}`);
      }
      
      // 화자 설정 로딩
      const voice = await this.loadVoiceSetting();
      if (voice && voice.id !== this.selectedVoice.id) {
        this.selectedVoice = voice;
        settingsChanged = true;
        this.log(`🎯 화자 설정 로딩: ${voice.name}`);
      }
      
      // 속도 설정 로딩
      const speed = await this.loadSpeedSetting();
      if (speed !== this.playbackSpeed) {
        this.playbackSpeed = speed;
        settingsChanged = true;
        this.log(`🎯 속도 설정 로딩: ${speed}x`);
      }
      
      // 테이크 리스트 표시 설정 로딩
      const takeListVisible = await this.loadTakeListVisibilitySetting();
      this.takeListVisible = takeListVisible;
      this.log(`🎯 테이크 리스트 표시 설정 로딩: ${takeListVisible ? 'ON' : 'OFF'}`);
      
      // 플로팅바 표시 설정 로딩
      const floatingBarVisible = await this.loadFloatingBarVisibilitySetting();
      this.floatingBarVisible = floatingBarVisible;
      this.log(`🎯 플로팅바 표시 설정 로딩: ${floatingBarVisible ? 'ON' : 'OFF'}`);
      
      // 콘솔 로그 설정 로딩
      const consoleLogEnabled = await this.loadConsoleLogSetting();
      if (consoleLogEnabled !== this.DEBUG_MODE) {
        this.DEBUG_MODE = consoleLogEnabled;
        settingsChanged = true;
        this.log(`🎯 콘솔 로그 설정 로딩: ${consoleLogEnabled ? 'ON' : 'OFF'}`);
      }
      
      this.log('🎯 모든 설정 로딩 완료');
      return settingsChanged;
    } catch (error) {
      this.warn('설정 로딩 중 오류:', error);
      return false;
    }
  }

  // UI 업데이트 헬퍼 메소드들
  updateVoiceUI() {
    // 음성 라벨 업데이트
    if (this.voiceLabel) {
      this.voiceLabel.textContent = `🎵 음성: ${this.selectedVoice.name}`;
    }
  }

  updateSpeedUI() {
    // 속도 UI 업데이트 (필요시 확장)
    this.log(`🎵 속도 UI 업데이트: ${this.playbackSpeed}x`);
  }

  // 🎯 설정 로딩 완료 후 모든 UI 업데이트
  updateAllUIWithSettings() {
    this.log('🎯 설정 로딩 완료: 모든 UI 업데이트');
    
    // 플러그인 활성화 상태에 따라 UI 초기화
    if (this.isPluginEnabled) {
      this.log('🟢 플러그인 활성화 상태로 UI 초기화');
      this.showUI();
      
      // 콘솔 로그 상태 업데이트
      this.updateConsoleLogStatus();
    } else {
      this.hideUI();
      if (this.bottomFloatingUI) {
        this.bottomFloatingUI.style.display = 'none';
      }
      this.hideTakeHoverIcon();
      this.removeYouTubeIcon();
      this.removeAllHighlights();
      
      // Enable the extension이 Off일 때 Show the take list와 floating toolbar도 자동으로 Off
      if (this.floatingUI) {
        this.floatingUI.style.display = 'none';
      }
      if (this.bottomFloatingUI) {
        this.bottomFloatingUI.style.display = 'none';
      }
    }
    
    // 백그라운드 스크립트에 아이콘 상태 업데이트 요청
    chrome.runtime.sendMessage({ 
      action: 'updateIcon', 
      enabled: this.isPluginEnabled 
    });
    
    // 하단 플로팅 UI 업데이트
    this.updateBottomFloatingUIState();
    
    // 플로팅 UI 업데이트 (있는 경우)
    this.updateVoiceUI();
    this.updateSpeedUI();
    
    // Console log 상태 업데이트
    this.updateConsoleLogStatus();
    
    // 기타 UI 요소들 업데이트 (필요시 확장)
    // this.updateFloatingUI(); // 함수가 정의되지 않아 주석 처리
  }

  // 🎯 페이지 로딩 완료 시 초기화 (다단계 시점 확보)
  async initializeWhenReady() {
    this.log(`📊 페이지 상태: ${document.readyState}`);
    
    // 🎯 1차: 최초 시점 - 본문 텍스트 로드 완료 시점
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.tryInitializeAtOptimalTiming());
    } else if (document.readyState === 'interactive') {
      // DOM은 준비됨, 리소스 로딩 중
      setTimeout(() => this.tryInitializeAtOptimalTiming(), 200);
    } else {
      // 이미 완전히 로드됨
      setTimeout(() => this.tryInitializeAtOptimalTiming(), 100);
    }
  }
  
  // 🎯 최적 타이밍에서 초기화 시도 (다단계 접근)
  async tryInitializeAtOptimalTiming() {
    this.log('🎯 최적 타이밍 초기화 시작');
    
    // 설정 로드 완료 대기
    await this.loadSettingsAsync();
    
    // UI 생성 (설정 로드 완료 후)
    this.createFloatingUI();
    this.setupKeyboardShortcuts();
    
    // 플러그인 활성화 상태에 따라 UI 표시/숨김
    if (this.isPluginEnabled) {
      this.showUI();
      this.updateStatus('페이지 분석 중...', '#FF9800');
    } else {
      this.hideUI();
    }
    
    // 🎯 1차: 최초 시점 - 기본 본문 텍스트 확보
    let bestTakeCount = 0;
    try {
      await this.analyzePageAndCreateTakes();
      bestTakeCount = this.preTakes.length;
      this.log(`📊 1차 시점 결과: ${bestTakeCount}개 테이크`);
      
      if (bestTakeCount >= 3) {
        this.log('✅ 1차 시점에서 충분한 테이크 확보');
        this.updateTakeCount();
        
        // 플러그인 활성화 상태에 따라 UI 표시
        if (this.isPluginEnabled) {
          this.showUI();
        }
        
        // 🤖 Zeta AI 모니터링 시작
        this.startZetaAIMonitoring();
        return;
      }
    } catch (error) {
      this.log('⚠️ 1차 시점 실패:', error.message);
    }
    
    // 🎯 2차: 추가 확보 시점 - 외부 솔루션 로딩 직전 (비디오 플레이어 오버라이트 방지로 주석처리)
    /*
    this.log('🔄 2차 시점 시도 중... (외부 솔루션 로딩 전)');
    this.updateStatus('추가 콘텐츠 분석 중...', '#FF9800');
    
    await new Promise(resolve => setTimeout(resolve, 800)); // 외부 솔루션 로딩 전 대기
    
    try {
      await this.analyzePageAndCreateTakes();
      const secondTakeCount = this.preTakes.length;
      this.log(`📊 2차 시점 결과: ${secondTakeCount}개 테이크 (이전: ${bestTakeCount}개)`);
      
      if (secondTakeCount > bestTakeCount) {
        bestTakeCount = secondTakeCount;
        this.log(`📈 2차 시점에서 개선: ${secondTakeCount}개`);
      }
      
      if (bestTakeCount >= 2) {
        this.log('✅ 2차 시점에서 최소 테이크 확보');
        this.updateTakeCount();
        this.showUI();
        return;
      }
    } catch (error) {
      this.log('⚠️ 2차 시점 실패:', error.message);
    }
    */
    
    // 🎯 3차: 최종 확보 시점 - 모든 로딩 완료 후 (비디오 플레이어 오버라이트 방지로 주석처리)
    /*
    this.log('🔄 3차 시점 시도 중... (최종 로딩 완료 후)');
    this.updateStatus('최종 콘텐츠 분석 중...', '#FF9800');
    
    // window.load 이벤트 대기 또는 추가 시간 대기
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve, { once: true });
        setTimeout(resolve, 2000); // 최대 2초 대기
      });
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    try {
      await this.analyzePageAndCreateTakes();
      const finalTakeCount = this.preTakes.length;
      this.log(`📊 3차 시점 결과: ${finalTakeCount}개 테이크 (이전: ${bestTakeCount}개)`);
      
      if (finalTakeCount > 0) {
        this.log(`✅ 최종 시점에서 ${finalTakeCount}개 테이크 확보`);
        this.updateTakeCount();
        this.showUI();
      } else {
        this.log('❌ 모든 시점에서 테이크 생성 실패');
        this.updateStatus('테이크 생성 실패 - 페이지를 새로고침해주세요', '#F44336');
      }
    } catch (error) {
      this.error('❌ 3차 시점 실패:', error);
      this.updateStatus('초기화 오류 - 페이지를 새로고침해주세요', '#F44336');
    }
    */
    
    // 🎯 1단계만 사용하여 비디오 플레이어 오버라이트 방지
    if (bestTakeCount > 0) {
      this.log(`✅ 1단계 시점에서 ${bestTakeCount}개 테이크 확보 (비디오 플레이어 오버라이트 방지)`);
      this.updateTakeCount();
      this.showUI();
      
      // 🤖 Zeta AI 모니터링 시작
      this.startZetaAIMonitoring();
    } else {
      this.log('❌ 1단계 시점에서 테이크 생성 실패');
      this.updateStatus('테이크 생성 실패 - 페이지를 새로고침해주세요', '#F44336');
    }
    
    // 🎥 YouTube 모드 시작 (테이크 생성 성공 여부와 관계없이)
    if (this.isYouTubeMode()) {
      this.log('🎥 YouTube 모드 감지됨 - YouTube 모드 시작');
      this.startYouTubeMode();
    }
  }
  
  // 🎯 웹페이지 분석 및 테이크 사전 생성
  async analyzePageAndCreateTakes() {
    // 플러그인이 비활성화된 경우 분석 중지
    if (!this.isPluginEnabled) {
      return;
    }
    
    this.log('🔍 웹페이지 분석 시작...');
    
    // 🔍 클리앙 디버깅: 현재 URL 확인
    this.log(`🌐 현재 URL: ${window.location.href}`);
    this.log(`🌐 도메인: ${window.location.hostname}`);
    
    // 🎥 YouTube에서는 일반적인 테이크 감지 비활성화
    if (this.isYouTubeMode()) {
      this.log('🎥 YouTube: 일반적인 테이크 감지 비활성화');
      this.preTakes = [];
      this.updateTakeCount();
      return;
    }
    
    // body 내부 구조 파악 (header, footer 제외)
    const bodyContent = this.extractMainContent();
    
    // div, p 기준으로 텍스트 정보가 있는 요소들을 순차적으로 찾기
    const contentElements = this.findContentElements(bodyContent);
    
    this.log(`📄 발견된 콘텐츠 요소: ${contentElements.length}개`);
    
    // 각 요소를 테이크로 변환
    this.preTakes = [];
    for (let i = 0; i < contentElements.length; i++) {
      const element = contentElements[i];
      const text = this.extractTextFromElement(element);
      
      if (text && text.length > 1) { // 최소 길이 체크 (2자 이상)
        // 중복 테이크 방지: 바로 이전 테이크와 내용이 같으면 스킵
        const previousTake = this.preTakes[this.preTakes.length - 1];
        const normalizedText = text.trim().replace(/\s+/g, ' '); // 공백 정규화
        const previousNormalizedText = previousTake ? previousTake.text.trim().replace(/\s+/g, ' ') : '';
        
        if (previousTake && normalizedText === previousNormalizedText) {
          this.log(`🔄 중복 테이크 스킵: "${text.substring(0, 30)}..." (이전 테이크와 동일)`);
          continue; // 중복이면 스킵
        }
        
        const takeId = `take-${this.preTakes.length + 1}`; // 실제 생성되는 순서로 ID 부여
        const language = await this.detectLanguage(text);
        
        const preTake = {
          id: takeId,
          index: this.preTakes.length,
          text: normalizedText, // 정규화된 텍스트 사용
          language: language,
          element: element,
          selector: this.generateElementSelector(element),
          isBuffered: false,
          audioUrl: null
        };
        
        this.preTakes.push(preTake);
        this.log(`📝 테이크 ${this.preTakes.length} 생성: "${normalizedText.substring(0, 50)}..." (${language})`);
      }
    }
    
    this.log(`✅ 총 ${this.preTakes.length}개 테이크 사전 생성 완료`);
    this.updateTakeListUI();
    this.updateTakeCount();
    
    // 테이크 호버 아이콘 설정
    this.setupTakeHoverIcons();
  }

  // 🎯 테이크 호버 아이콘 설정
  setupTakeHoverIcons() {
    // 🤖 Zeta AI / ChatGPT에서는 테이크 호버 아이콘 비활성화
    if (this.isZetaOrChatGPTMode()) {
      this.log('🤖 Zeta AI / ChatGPT: 테이크 호버 아이콘 비활성화');
      return;
    }

    // 🎥 YouTube에서는 테이크 호버 아이콘 비활성화하고 YouTube 전용 아이콘 생성
    if (this.isYouTubeMode()) {
      this.log('🎥 YouTube: 테이크 호버 아이콘 비활성화, YouTube 전용 아이콘 생성');
      this.createYouTubeIcon();
      return;
    }
    
    if (!this.preTakes || this.preTakes.length === 0) return;
    
    this.preTakes.forEach((take, index) => {
      if (take.element) {
        // 가장 작은 텍스트 포함 요소 찾기
        const smallestElement = this.findSmallestTextContainer(take.element, take.text);
        
        // 마우스 진입 시 아이콘 표시
        smallestElement.addEventListener('mouseenter', (event) => {
          this.currentHoverTake = take;
          this.showTakeHoverIcon(take, smallestElement);
        });
        
        // 마우스 이탈 시에는 아이콘을 즉시 숨기지 않음 (다른 테이크로 이동할 때만 변경)
        smallestElement.addEventListener('mouseleave', (event) => {
          // 다른 테이크 요소로 이동하는지 확인
          setTimeout(() => {
            const hoveredElement = document.elementFromPoint(event.clientX, event.clientY);
            const newTake = this.findTakeFromElement(hoveredElement);
            
            if (newTake && newTake !== this.currentHoverTake) {
              // 다른 테이크로 이동
              this.currentHoverTake = newTake;
              const newSmallestElement = this.findSmallestTextContainer(newTake.element, newTake.text);
              this.showTakeHoverIcon(newTake, newSmallestElement);
            }
            // 테이크가 없는 곳으로 이동하면 아이콘 유지 (마지막 위치)
          }, 10);
        });
      }
    });
  }

  // 🎯 테이크 호버 아이콘 표시
  showTakeHoverIcon(take, element) {
    // 플러그인이 비활성화된 경우 아이콘 표시하지 않음
    if (!this.isPluginEnabled) {
      return;
    }
    
    // 기존 아이콘 제거
    this.hideTakeHoverIcon();
    
    // 현재 테이크와 요소 저장
    this.currentIconTake = take;
    this.currentIconElement = element;
    
    const isDark = this.currentTheme === 'dark';
    const iconSize = 19;
    
    // 아이콘 생성
    this.takeHoverIcon = this.createTakeIcon(iconSize, isDark);
    
    // 초기 위치 설정 및 스타일 적용
    this.setupIconPositionAndStyle(iconSize);
    
    // 이벤트 리스너 설정
    this.setupIconEventListeners(take);
    
    // DOM에 추가
    document.body.appendChild(this.takeHoverIcon);
    
    // 애니메이션 트리거 (DOM 추가 후 바로)
    this.triggerIconAnimation();
    
    // 스크롤 이벤트 리스너 설정
    this.setupIconScrollListener();
    
    // 현재 테이크 호버 추적 설정
    this.setupCurrentTakeHoverTracking();
    
    // 3초 후 자동 페이드아웃 타이머 설정
    this.setupIconAutoHideTimer();
  }

  // 🎯 아이콘 DOM 요소 생성
  createTakeIcon(iconSize, isDark) {
    const icon = document.createElement('div');
    icon.id = 'tts-take-hover-icon';
    icon.innerHTML = `
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 152 152" xmlns="http://www.w3.org/2000/svg">
        <style>
          .tts-icon-blue { fill: #007AFF; }
          .tts-icon-white { fill: #fff; }
          
          /* 애니메이션 요소들 초기 상태: 투명 */
          .tts-icon-element {
            opacity: 0;
          }
          
          /* 순차 애니메이션 지연 - 단순히 opacity만 변경 */
          .tts-icon-animate .tts-icon-element-1 { 
            animation: ttsIconShow 0.1s ease 0.1s forwards; 
          }
          .tts-icon-animate .tts-icon-element-2 { 
            animation: ttsIconShow 0.1s ease 0.15s forwards; 
          }
          .tts-icon-animate .tts-icon-element-3 { 
            animation: ttsIconShow 0.1s ease 0.20s forwards; 
          }
          .tts-icon-animate .tts-icon-element-4 { 
            animation: ttsIconShow 0.1s ease 0.25s forwards; 
          }
          
          /* 단순 표시 애니메이션 */
          @keyframes ttsIconShow {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        </style>
        <g>
          <circle class="tts-icon-white" cx="76" cy="76" r="72"/>
          <path class="tts-icon-blue" d="M76,152C34.1,152,0,117.9,0,76S34.1,0,76,0s76,34.1,76,76-34.1,76-76,76ZM76,8C38.5,8,8,38.5,8,76s30.5,68,68,68,68-30.5,68-68S113.5,8,76,8Z"/>
        </g>
        <!-- 1. 왼쪽 작은 원 -->
        <circle class="tts-icon-blue tts-icon-element tts-icon-element-1" cx="51.3" cy="76" r="10.8"/>
        <!-- 2-1. 위쪽 사선 -->
        <rect class="tts-icon-blue tts-icon-element tts-icon-element-2" x="77" y="41.2" width="23.3" height="8" transform="translate(-8.5 66.6) rotate(-39.4)"/>
        <!-- 2-2. 가운데 직선 -->
        <rect class="tts-icon-blue tts-icon-element tts-icon-element-3" x="83" y="72" width="22.8" height="8"/>
        <!-- 2-3. 아래쪽 사선 -->
        <rect class="tts-icon-blue tts-icon-element tts-icon-element-4" x="84.7" y="95.1" width="8" height="23.3" transform="translate(-50.1 107.5) rotate(-50.6)"/>
      </svg>
    `;
    return icon;
  }

  // 🎯 아이콘 위치 및 스타일 설정
  setupIconPositionAndStyle(iconSize) {
    this.takeHoverIcon.style.cssText = `
      position: fixed !important;
      z-index: 100001 !important;
      pointer-events: auto !important;
      cursor: pointer !important;
      background: rgba(255, 255, 255, 0.9) !important;
      border-radius: 50% !important;
      padding: 0 !important;
      box-shadow: 0 2px 8px #227cff40 !important;
      transition: transform 0.2s ease, opacity 0.5s ease !important;
      width: ${iconSize}px !important;
      height: ${iconSize}px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      opacity: 1 !important;
    `;
    
    // 초기 위치 설정
    this.updateIconPosition();
  }

  // 🎯 아이콘 이벤트 리스너 설정
  setupIconEventListeners(take) {
    // 클릭 이벤트
    this.takeHoverIcon.addEventListener('click', async (event) => {
      event.stopPropagation();
      await this.startPlaybackFromTake(take);
    });
    
    // 호버 효과
    this.takeHoverIcon.addEventListener('mouseenter', () => {
      this.takeHoverIcon.style.transform = 'scale(1.1)';
    });
    
    this.takeHoverIcon.addEventListener('mouseleave', () => {
      this.takeHoverIcon.style.transform = 'scale(1.0)';
    });
  }

  // 🎯 테이크 호버 아이콘 숨김
  hideTakeHoverIcon() {
    if (this.takeHoverIcon) {
      this.takeHoverIcon.remove();
      this.takeHoverIcon = null;
    }
    
    // 스크롤 이벤트 리스너 제거
    this.removeIconScrollListener();
    
    // 자동 숨김 타이머 제거
    this.clearIconAutoHideTimer();
    
    // 호버 추적 정리
    this.cleanupCurrentTakeHoverTracking();
    
    // 저장된 요소 정보 초기화
    this.currentIconTake = null;
    this.currentIconElement = null;
  }

  // 🎥 YouTube 전용 아이콘 생성 (제목 행 오른쪽)
  createYouTubeIcon() {
    this.log('🎥 YouTube: 아이콘 생성 함수 시작');
    
    // 기존 YouTube 아이콘 제거
    if (this.youtubeIcon) {
      this.youtubeIcon.remove();
      this.youtubeIcon = null;
    }

    // YouTube 제목 요소 찾기 (실제 YouTube 페이지 구조 기반)
    let titleElement = null;
    
    // 1. 실제 YouTube 페이지의 정확한 선택자들 (우선순위 순)
    const selectors = [
      // 가장 정확한 선택자들
      'h1.ytd-watch-metadata',
      'h1.style-scope.ytd-watch-metadata',
      'ytd-watch-metadata h1',
      'ytd-video-primary-info-renderer h1',
      
      // 컨테이너 기반 선택자들
      'div#title h1',
      'div#title',
      'ytd-video-primary-info-renderer div#title h1',
      
      // 일반적인 선택자들
      'h1[class*="ytd-watch"]',
      'h1[class*="title"]',
      'h1',
      
      // 추가 선택자들
      'ytd-video-primary-info-renderer h1',
      'ytd-watch-metadata ytd-video-primary-info-renderer h1',
      'div#meta h1',
      'div#meta div#title h1'
    ];
    
    for (const selector of selectors) {
      titleElement = document.querySelector(selector);
      if (titleElement) {
        this.log(`🎥 YouTube: 제목 요소 발견 (${selector}):`, titleElement);
        this.log(`🎥 YouTube: 제목 텍스트: "${titleElement.textContent.trim()}"`);
        break;
      }
    }
    
    if (!titleElement) {
      this.log('🎥 YouTube: 제목 요소를 찾을 수 없음');
      this.log('🎥 YouTube: 페이지의 모든 h1 요소들:');
      document.querySelectorAll('h1').forEach((h1, index) => {
        this.log(`  ${index + 1}. <h1> "${h1.textContent.trim()}" (클래스: ${h1.className})`);
      });
      this.log('🎥 YouTube: 기본 위치에 아이콘 생성');
      this.createYouTubeIconAtDefaultPosition();
      return;
    }

    const isDark = this.currentTheme === 'dark';
    const iconSize = 24; // 아이콘 크기 증가

    // YouTube 아이콘 생성 (더 눈에 띄는 스타일)
    this.youtubeIcon = document.createElement('div');
    this.youtubeIcon.id = 'youtube-perplexity-icon';
    this.youtubeIcon.innerHTML = `
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" fill="${isDark ? '#ffffff' : '#000000'}" opacity="0.9"/>
        <path d="M8 6v12l10-6z" fill="${isDark ? '#000000' : '#ffffff'}"/>
      </svg>
    `;

    // 위치 설정 - 제목 행 오른쪽 (타이틀 우측 여백)
    const rect = titleElement.getBoundingClientRect();
    const titleContainer = titleElement.closest('div#title') || titleElement.parentElement;
    const containerRect = titleContainer ? titleContainer.getBoundingClientRect() : rect;
    
    this.youtubeIcon.style.cssText = `
      position: fixed !important;
      top: ${rect.top + (rect.height - iconSize) / 2}px !important;
      left: ${containerRect.right + 15}px !important;
      z-index: 100000 !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      cursor: pointer !important;
      background: transparent !important;
      border-radius: 50% !important;
      width: ${iconSize}px !important;
      height: ${iconSize}px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: transform 0.2s ease, opacity 0.2s ease !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
    `;

    this.log('🎥 YouTube: 제목 요소 위치:', rect);
    this.log('🎥 YouTube: 컨테이너 위치:', containerRect);
    this.log('🎥 YouTube: 아이콘 위치 설정:', `${rect.top + (rect.height - iconSize) / 2}px, ${containerRect.right + 15}px`);
    this.log('🎥 YouTube: 아이콘 요소 생성됨:', this.youtubeIcon);

    // 클릭 이벤트 설정
    this.youtubeIcon.addEventListener('click', async (event) => {
      event.stopPropagation();
      this.log('🎥 YouTube: 아이콘 클릭됨');
      await this.handleYouTubeGeminiRequest();
    });

    // 호버 효과
    this.youtubeIcon.addEventListener('mouseenter', () => {
      this.youtubeIcon.style.transform = 'scale(1.2)';
      this.youtubeIcon.style.opacity = '1';
    });

    this.youtubeIcon.addEventListener('mouseleave', () => {
      this.youtubeIcon.style.transform = 'scale(1.0)';
      this.youtubeIcon.style.opacity = '0.9';
    });

    document.body.appendChild(this.youtubeIcon);
    this.log('🎥 YouTube: Perplexity 아이콘 생성 완료');
    this.log('🎥 YouTube: 아이콘이 DOM에 추가됨:', document.body.contains(this.youtubeIcon));
    
    // 추가 확인: 아이콘이 실제로 보이는지 확인
    setTimeout(() => {
      if (this.youtubeIcon && document.body.contains(this.youtubeIcon)) {
        const computedStyle = window.getComputedStyle(this.youtubeIcon);
        this.log('🎥 YouTube: 아이콘 계산된 스타일:', {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          zIndex: computedStyle.zIndex,
          position: computedStyle.position,
          top: computedStyle.top,
          left: computedStyle.left
        });
      }
    }, 100);
  }

  // 🎥 YouTube 기본 위치에 아이콘 생성
  createYouTubeIconAtDefaultPosition() {
    this.log('🎥 YouTube: 기본 위치 아이콘 생성 시작');
    
    const isDark = this.currentTheme === 'dark';
    const iconSize = 24;
    
    // 더 눈에 띄는 아이콘 생성
    this.youtubeIcon = document.createElement('div');
    this.youtubeIcon.id = 'youtube-perplexity-icon';
    this.youtubeIcon.innerHTML = `
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" fill="${isDark ? '#ffffff' : '#000000'}" opacity="0.9"/>
        <path d="M8 6v12l10-6z" fill="${isDark ? '#000000' : '#ffffff'}"/>
      </svg>
    `;
    
    this.youtubeIcon.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      left: calc(100vw - 60px) !important;
      z-index: 100000 !important;
      opacity: 1 !important;
      background: transparent !important;
      border-radius: 50% !important;
      width: ${iconSize}px !important;
      height: ${iconSize}px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      pointer-events: auto !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
      transition: transform 0.2s ease, opacity 0.2s ease !important;
    `;

    // 클릭 이벤트 설정
    this.youtubeIcon.addEventListener('click', async (event) => {
      event.stopPropagation();
      this.log('🎥 YouTube: 기본 위치 아이콘 클릭됨');
      await this.handleYouTubeGeminiRequest();
    });

    // 호버 효과
    this.youtubeIcon.addEventListener('mouseenter', () => {
      this.youtubeIcon.style.transform = 'scale(1.2)';
      this.youtubeIcon.style.opacity = '1';
    });

    this.youtubeIcon.addEventListener('mouseleave', () => {
      this.youtubeIcon.style.transform = 'scale(1.0)';
      this.youtubeIcon.style.opacity = '0.9';
    });

    document.body.appendChild(this.youtubeIcon);
    this.log('🎥 YouTube: 기본 위치에 Perplexity 아이콘 생성 완료');
    this.log('🎥 YouTube: 기본 위치 아이콘이 DOM에 추가됨:', document.body.contains(this.youtubeIcon));
  }

  // 🎥 YouTube Gemini 요청 처리
  async handleYouTubeGeminiRequest() {
    try {
      this.log('🎥 YouTube: Gemini 요청 시작');
      
      const currentUrl = window.location.href;
      
      // Gemini API가 로드되었는지 확인
      if (!window.geminiAPI) {
        this.log('🎥 YouTube: Gemini API가 로드되지 않음, 동적 로드 시도');
        await this.loadGeminiAPI();
      }
      
      // Gemini API 사용
      if (window.geminiAPI && window.geminiAPI.convertYouTubeToBookContent) {
        const response = await window.geminiAPI.convertYouTubeToBookContent(currentUrl);
        
        if (response) {
          this.log('🎥 YouTube: Gemini 응답 받음, 테이크 생성 시작');
          
          // 응답을 테이크로 변환
          await this.createTakesFromGeminiResponse(response);
          
          // 기본 테이크 재생 로직으로 1번 테이크부터 순차 재생
          if (this.preTakes && this.preTakes.length > 0) {
            await this.startPlaybackFromTake(this.preTakes[0]);
          }
        }
      } else {
        this.error('🎥 YouTube: Gemini API를 사용할 수 없음');
        alert('Gemini API를 로드할 수 없습니다. 페이지를 새로고침해보세요.');
      }
    } catch (error) {
      this.error('🎥 YouTube: Gemini 요청 실패:', error);
      alert('Gemini API 요청에 실패했습니다: ' + error.message);
    }
  }
  
  // 🎥 Gemini API 동적 로드
  async loadGeminiAPI() {
    return new Promise((resolve, reject) => {
      try {
        // 이미 로드되었는지 확인
        if (window.geminiAPI) {
          resolve();
          return;
        }
        
        // 1. 먼저 content_scripts에서 로드되었는지 확인 (잠시 대기)
        setTimeout(() => {
          if (window.geminiAPI) {
            this.log('🎥 YouTube: Gemini API가 이미 로드됨');
            resolve();
            return;
          }
          
          // 2. 동적 로드 시도
          const script = document.createElement('script');
          script.src = chrome.runtime.getURL('gemini-api.js');
          script.onload = () => {
            this.log('🎥 YouTube: Gemini API 동적 로드 완료');
            resolve();
          };
          script.onerror = () => {
            this.error('🎥 YouTube: Gemini API 동적 로드 실패');
            reject(new Error('Gemini API 로드 실패'));
          };
          
          document.head.appendChild(script);
        }, 100); // 100ms 대기
        
      } catch (error) {
        this.error('🎥 YouTube: Gemini API 로드 중 오류:', error);
        reject(error);
      }
    });
  }

  // 🎥 Gemini 응답을 테이크로 변환
  async createTakesFromGeminiResponse(response) {
    try {
      this.log('🎥 YouTube: Gemini 응답을 테이크로 변환 시작');
      
      // 기존 테이크 초기화
      this.preTakes = [];
      
      // 응답 텍스트를 문단으로 분할
      const paragraphs = response.split('\n\n').filter(p => p.trim().length > 0);
      
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i].trim();
        if (paragraph.length > 10) { // 최소 길이 체크
          const takeId = `youtube-take-${i + 1}`;
          const language = await this.detectLanguage(paragraph);
          
          const take = {
            id: takeId,
            index: i,
            text: paragraph,
            language: language,
            element: null, // YouTube에서는 DOM 요소 없음
            selector: null,
            isBuffered: false,
            audioUrl: null
          };
          
          this.preTakes.push(take);
          this.log(`🎥 YouTube: 테이크 ${i + 1} 생성: "${paragraph.substring(0, 50)}..." (${language})`);
        }
      }
      
      this.log(`🎥 YouTube: 총 ${this.preTakes.length}개 테이크 생성 완료`);
      this.updateTakeCount();
      
    } catch (error) {
      this.error('🎥 YouTube: 테이크 변환 실패:', error);
    }
  }

  // 🎥 YouTube 모드 시작
  startYouTubeMode() {
    if (!this.isYouTubeMode()) {
      this.log('🎥 YouTube 모드가 아닙니다');
      return;
    }
    
    this.log('🎥 YouTube 모드 시작');
    
    // YouTube에서는 일반적인 테이크 감지 비활성화
    // 대신 Perplexity 아이콘만 생성
    
    // 더 많은 시점에서 아이콘 생성 시도 (실제 YouTube 로딩 시간 고려)
    const createIconAttempts = [
      { delay: 100, name: '즉시 시도' },
      { delay: 500, name: '0.5초 후 시도' },
      { delay: 1000, name: '1초 후 시도' },
      { delay: 2000, name: '2초 후 시도' },
      { delay: 3000, name: '3초 후 시도' },
      { delay: 5000, name: '5초 후 시도' },
      { delay: 8000, name: '8초 후 시도' },
      { delay: 10000, name: '10초 후 시도' }
    ];
    
    createIconAttempts.forEach(({ delay, name }) => {
      setTimeout(() => {
        this.log(`🎥 YouTube: ${name} - 아이콘 생성 시도`);
        this.createYouTubeIcon();
      }, delay);
    });
    
    // MutationObserver로 DOM 변경 감지하여 동적으로 생성된 제목 요소에 대응
    this.setupYouTubeTitleObserver();
    
    // 추가로 주기적으로 아이콘 상태 확인
    this.startYouTubeIconMonitoring();
  }
  
  // 🎥 YouTube 제목 요소 변경 감지
  setupYouTubeTitleObserver() {
    if (!this.isYouTubeMode()) return;
    
    this.log('🎥 YouTube: 제목 요소 변경 감지 설정');
    
    this.youtubeTitleObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // 새로 추가된 노드들 확인
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // 제목 관련 요소가 추가되었는지 확인
              if (this.isYouTubeTitleElement(node)) {
                this.log('🎥 YouTube: 새로운 제목 요소 감지, 아이콘 재생성');
                setTimeout(() => this.createYouTubeIcon(), 100);
              }
            }
          });
        }
      });
    });
    
    // body 전체 감시
    this.youtubeTitleObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // 🎥 YouTube 제목 요소인지 확인
  isYouTubeTitleElement(element) {
    if (!element || !element.querySelector) return false;
    
    const titleSelectors = [
      'h1.ytd-watch-metadata',
      'h1.style-scope.ytd-watch-metadata',
      'div#title h1',
      'div#title',
      'ytd-watch-metadata h1',
      'ytd-video-primary-info-renderer h1',
      'h1[class*="ytd-watch"]',
      'h1[class*="title"]'
    ];
    
    return titleSelectors.some(selector => {
      return element.matches(selector) || element.querySelector(selector);
    });
  }
  
  // 🎥 YouTube 아이콘 모니터링 시작
  startYouTubeIconMonitoring() {
    if (!this.isYouTubeMode()) return;
    
    this.log('🎥 YouTube: 아이콘 모니터링 시작');
    
    // 30초마다 아이콘 상태 확인
    this.youtubeIconMonitoringInterval = setInterval(() => {
      const existingIcon = document.getElementById('youtube-perplexity-icon');
      const titleElement = document.querySelector('h1.ytd-watch-metadata, h1.style-scope.ytd-watch-metadata, ytd-watch-metadata h1');
      
      if (!existingIcon && titleElement) {
        this.log('🎥 YouTube: 모니터링에서 제목 발견, 아이콘 재생성');
        this.createYouTubeIcon();
      } else if (existingIcon && !titleElement) {
        this.log('🎥 YouTube: 모니터링에서 제목 사라짐, 아이콘 제거');
        this.removeYouTubeIcon();
      }
    }, 30000); // 30초마다 확인
  }

  // 🎯 아이콘 자동 숨김 타이머 설정
  setupIconAutoHideTimer() {
    // 기존 타이머 제거
    this.clearIconAutoHideTimer();
    
    // 3초 후 페이드아웃 시작 (호버 상태 확인)
    this.iconAutoHideTimer = setTimeout(() => {
      this.checkAndFadeOutIcon();
    }, 3000);
  }

  // 🎯 호버 상태 확인 후 페이드아웃
  checkAndFadeOutIcon() {
    // 마우스가 현재 테이크 위에 있으면 타이머 재설정
    if (this.isCurrentTakeHovered()) {
      this.setupIconAutoHideTimer();
      return;
    }
    
    // 호버 상태가 아니면 페이드아웃
    this.fadeOutIcon();
  }

  // 🎯 현재 테이크가 호버 상태인지 확인
  isCurrentTakeHovered() {
    if (!this.currentIconElement) return false;
    
    // 마우스 이벤트 기반 호버 상태 확인
    return this.isMouseOverCurrentTake;
  }

  // 🎯 현재 테이크에 마우스 이벤트 리스너 설정
  setupCurrentTakeHoverTracking() {
    if (!this.currentIconElement) return;
    
    // 초기 상태 설정
    this.isMouseOverCurrentTake = false;
    
    // 마우스 엔터 이벤트
    const handleMouseEnter = () => {
      this.isMouseOverCurrentTake = true;
    };
    
    // 마우스 리브 이벤트
    const handleMouseLeave = () => {
      this.isMouseOverCurrentTake = false;
    };
    
    // 이벤트 리스너 추가
    this.currentIconElement.addEventListener('mouseenter', handleMouseEnter);
    this.currentIconElement.addEventListener('mouseleave', handleMouseLeave);
    
    // 정리를 위해 저장
    this.currentTakeHoverListeners = {
      element: this.currentIconElement,
      enter: handleMouseEnter,
      leave: handleMouseLeave
    };
  }

  // 🎯 현재 테이크 호버 추적 정리
  cleanupCurrentTakeHoverTracking() {
    if (this.currentTakeHoverListeners) {
      const { element, enter, leave } = this.currentTakeHoverListeners;
      element.removeEventListener('mouseenter', enter);
      element.removeEventListener('mouseleave', leave);
      this.currentTakeHoverListeners = null;
    }
    this.isMouseOverCurrentTake = false;
  }

  // 🎯 아이콘 자동 숨김 타이머 제거
  clearIconAutoHideTimer() {
    if (this.iconAutoHideTimer) {
      clearTimeout(this.iconAutoHideTimer);
      this.iconAutoHideTimer = null;
    }
  }

  // 🎯 아이콘 페이드아웃 애니메이션
  fadeOutIcon() {
    if (!this.takeHoverIcon) return;
    
    // 페이드아웃 시작
    this.takeHoverIcon.style.opacity = '0';
    
    // 0.5초 후 완전히 제거
    setTimeout(() => {
      this.hideTakeHoverIcon();
    }, 500);
  }

  // 🎯 아이콘 자동 숨김 타이머 리셋 (새로운 테이크 선택 시)
  resetIconAutoHideTimer() {
    if (this.takeHoverIcon) {
      // 투명도 복원 (페이드아웃 중이었다면)
      this.takeHoverIcon.style.opacity = '1';
      
      // 타이머 재설정
      this.setupIconAutoHideTimer();
    }
  }

  // 🎯 아이콘 순차 애니메이션 트리거
  triggerIconAnimation() {
    if (!this.takeHoverIcon) return;
    
    // 아이콘에 애니메이션 클래스 추가 (약간 지연 후)
    requestAnimationFrame(() => {
      this.takeHoverIcon.classList.add('tts-icon-animate');
    });
  }

  // 🎯 아이콘 위치 업데이트 (뷰포트 기준)
  updateIconPosition() {
    if (!this.takeHoverIcon || !this.currentIconElement) return;
    
    const rect = this.currentIconElement.getBoundingClientRect();
    
    // 요소가 화면에서 완전히 벗어났는지 확인
    if (this.isElementOutOfView(rect)) {
      this.hideTakeHoverIcon();
      return;
    }
    
    // 뷰포트 기준 위치 계산 (position: fixed이므로 스크롤 값 불필요)
    const iconPosition = this.calculateIconViewportPosition(rect);
    
    // 위치 업데이트 (뷰포트 좌표)
    this.takeHoverIcon.style.top = `${iconPosition.top}px`;
    this.takeHoverIcon.style.left = `${iconPosition.left}px`;
  }

  // 🎯 요소가 화면 밖에 있는지 확인
  isElementOutOfView(rect) {
    return rect.bottom < -50 || rect.top > window.innerHeight + 50;
  }

  // 🎯 뷰포트 기준 아이콘 위치 계산
  calculateIconViewportPosition(rect) {
    const computedStyle = window.getComputedStyle(this.currentIconElement);
    const tagName = this.currentIconElement.tagName.toLowerCase();
    
    let topOffset = rect.top;
    
    // 태그별 텍스트 베이스라인 조정
    if (tagName === 'p') {
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      const lineHeight = parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.2;
      const fontSize = parseFloat(computedStyle.fontSize) || 16;
      topOffset += paddingTop + (lineHeight - fontSize) / 2;
    } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      topOffset += paddingTop + 2;
    } else if (tagName === 'div') {
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      topOffset += paddingTop;
    }
    
    return {
      top: topOffset - 2, // 미세 조정
      left: rect.left - 30  // 좌측으로 30px
    };
  }

  // 🎯 스크롤 이벤트 리스너 설정
  setupIconScrollListener() {
    this.removeIconScrollListener();
    
    // 쓰로틀링으로 성능 최적화
    this.iconScrollHandler = this.throttle(() => {
      this.updateIconPosition();
    }, 16); // 60fps
    
    window.addEventListener('scroll', this.iconScrollHandler, { passive: true });
    window.addEventListener('resize', this.iconScrollHandler, { passive: true });
  }

  // 🎯 스크롤 이벤트 리스너 제거
  removeIconScrollListener() {
    if (this.iconScrollHandler) {
      window.removeEventListener('scroll', this.iconScrollHandler);
      window.removeEventListener('resize', this.iconScrollHandler);
      this.iconScrollHandler = null;
    }
  }

  // 🎯 쓰로틀링 유틸리티
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }

  // 🎯 가장 작은 텍스트 포함 요소 찾기
  findSmallestTextContainer(element, text) {
    // 텍스트가 포함된 가장 작은 요소를 찾기 위해 자식 요소들을 탐색
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          // 노드의 텍스트 내용이 찾고자 하는 텍스트를 포함하는지 확인
          const nodeText = node.textContent?.trim();
          if (nodeText && text && nodeText.includes(text.substring(0, 50))) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    let smallestElement = element;
    let smallestSize = element.getBoundingClientRect().width * element.getBoundingClientRect().height;
    
    let currentNode;
    while (currentNode = walker.nextNode()) {
      const rect = currentNode.getBoundingClientRect();
      const size = rect.width * rect.height;
      
      // 크기가 더 작고, 실제로 화면에 보이는 요소인 경우
      if (size > 0 && size < smallestSize) {
        smallestElement = currentNode;
        smallestSize = size;
      }
    }
    
    return smallestElement;
  }

  // 🎯 요소에서 해당하는 테이크 찾기
  findTakeFromElement(element) {
    if (!element || !this.preTakes) return null;
    
    // 요소가 테이크에 속하는지 확인
    for (const take of this.preTakes) {
      if (take.element && (take.element.contains(element) || take.element === element)) {
        return take;
      }
    }
    
    return null;
  }


  
  // 🎯 body 내부 메인 콘텐츠 추출 (header, footer 제외)
  extractMainContent() {
    const body = document.body;
    if (!body) return null;
    
    const hostname = window.location.hostname.toLowerCase();
    this.log(`🌐 사이트별 메인 콘텐츠 추출 시작: ${hostname}`);
    
    // 🎯 사이트별 특화 본문 영역 식별
    let mainContent = window.htmlAnalyzerSites.getSiteSpecificMainContent(hostname, body);
    
    if (!mainContent) {
      // 일반적인 메인 콘텐츠 영역 찾기
      mainContent = window.htmlAnalyzerCommon.extractMainContent();
    }
    
    return mainContent;
  }


  
  // 🎯 콘텐츠 요소들 찾기 (DOM 순서대로 순차적 처리)
  findContentElements(container) {
    return window.htmlAnalyzerCommon.findContentElements(container);
  }
  
  // 🎯 요소 제외 여부 판단 (Daum 뉴스 디버깅 강화)
  shouldExcludeElement(element) {
    return window.htmlAnalyzerCommon.shouldExcludeElement(element);
  }
  
  // 🎯 요소 가시성 확인
  isVisibleElement(element) {
    return window.htmlAnalyzerCommon.isVisibleElement(element);
  }
  
  // 🎯 요소의 직접 텍스트 내용 추출 (하위 블록 요소 제외)
  getDirectTextContent(element) {
    return window.htmlAnalyzerCommon.getDirectTextContent(element);
  }
  
  // 🎯 요소에서 전체 텍스트 추출 (테이크 생성용)
  extractTextFromElement(element) {
    return window.htmlAnalyzerCommon.extractTextFromElement(element);
  }
  
  // 🎯 요소 선택자 생성
  generateElementSelector(element) {
    return window.htmlAnalyzerCommon.generateElementSelector(element);
  }
  
  // 🎯 테이크 리스트 UI 업데이트 (국기 + 텍스트)
  updateTakeListUI() {
    if (this.takeListContainer) {
      // 테마 색상 가져오기
      const isDark = this.currentTheme === 'dark';
      const textColor = isDark ? 'rgba(255, 255, 255, 0.6)' : '#1d1d1d';
      const itemBgColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
      
      let html = '';
      
      this.preTakes.forEach((take, index) => {
        // 언어별 국기 이모지
        const flagEmoji = take.language === 'ko' ? '🇰🇷' : 
                         take.language === 'en' ? '🇺🇸' : 
                         take.language === 'ja' ? '🇯🇵' : '🌐';
        
        html += `<div style="
          margin-bottom: 6px; 
          font-size: 8px; 
          line-height: 1.6em;
          color: ${textColor};
        ">
          <span>${flagEmoji}</span>
          <span>${take.text.substring(0, 100)}${take.text.length > 100 ? '...' : ''} / ${take.text.length}</span>
        </div>`;
      });
      
      this.takeListContainer.innerHTML = html;
    }
  }

  // 🎯 개선된 플로팅 UI 생성 (HTML 뷰어 포함)
  createFloatingUI() {
    // 기존 UI 제거
    const existingUI = document.getElementById('tts-floating-ui');
    if (existingUI) {
      existingUI.remove();
    }

    // 테마별 배경색 설정 (하단 플로팅 UI와 동일)
    const isDark = this.currentTheme === 'dark';
    const bgColor = isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.6)' : '#1d1d1d';
    const borderColor = isDark ? 'rgba(125, 125, 125, 0.25)' : 'rgba(125, 125, 125, 0.5)';

    // 플로팅 컨테이너 생성 (테이크 리스트 포함)
    this.floatingUI = document.createElement('div');
    this.floatingUI.id = 'tts-floating-ui';
    this.floatingUI.style.cssText = `
      position: fixed !important;
      top: 15px !important;
      right: 15px !important;
      background: ${bgColor} !important;
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
      color: ${textColor} !important;
      padding: 12px !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
      font-size: ${this.UI_FONT_SIZE} !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      z-index: 99998 !important;
      max-width: 100px !important;
      max-height: 85vh !important;
      display: none !important;
      overflow-y: auto !important;
      border: 1px solid ${borderColor} !important;
    `;

    // 🎯 Console log 상태 표시
    this.consoleLogStatusLabel = document.createElement('div');
    this.consoleLogStatusLabel.id = 'tts-console-log-status';
    this.consoleLogStatusLabel.style.cssText = `
      color: ${textColor} !important;
      font-size: 8px !important;
      font-weight: normal !important;
      margin-bottom: 4px !important;
      text-align: left !important;
      white-space: pre-line !important;
      line-height: 1rem !important;
    `;
    
    // 🎯 구분선
    const divider = document.createElement('div');
    divider.style.cssText = `
      height: 1px !important;
      background: ${borderColor} !important;
      margin: 4px 0 8px 0 !important;
    `;

    // 🎯 발견된 테이크 수 표시
    this.takeCountLabel = document.createElement('div');
    this.takeCountLabel.id = 'tts-take-count';
    this.takeCountLabel.style.cssText = `
      color: ${textColor} !important;
      font-size: 8px !important;
      font-weight: normal !important;
      margin-bottom: 8px !important;
      text-align: left !important;
    `;
    this.takeCountLabel.textContent = '0개 테이크 감지됨';

    // 🎯 테이크 리스트 컨테이너 (스크롤 가능)
    this.takeListContainer = document.createElement('div');
    this.takeListContainer.id = 'tts-take-list';
    this.takeListContainer.style.cssText = `
      overflow-y: auto !important;
      scrollbar-width: thin !important;
      color: ${textColor} !important;
    `;

    // 🎯 요소 조립
    this.floatingUI.appendChild(this.consoleLogStatusLabel);
    this.floatingUI.appendChild(divider);
    this.floatingUI.appendChild(this.takeCountLabel);
    this.floatingUI.appendChild(this.takeListContainer);

    document.body.appendChild(this.floatingUI);
    
    // Console log 상태 초기화
    this.updateConsoleLogStatus();
    
    // 플러그인 활성화 상태에 따라 초기 표시/숨김 설정
    if (!this.isPluginEnabled) {
      this.floatingUI.style.display = 'none';
    }
    
    this.log('🎯 TTS UI 생성 완료 (간소화):', this.floatingUI);
  }

  // 🎯 Console log 상태 업데이트
  updateConsoleLogStatus() {
    if (this.consoleLogStatusLabel) {
      if (this.DEBUG_MODE) {
        this.consoleLogStatusLabel.textContent = 'Console log: ON\n⚠️ 성능저하 있음 ⚠️';
        this.consoleLogStatusLabel.style.color = this.currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#1d1d1d'; // 기본 색상
      } else {
        this.consoleLogStatusLabel.textContent = 'Console log: OFF';
        this.consoleLogStatusLabel.style.color = this.currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#1d1d1d'; // 기본 색상
      }
    }
  }

  // 🎯 테이크 수 업데이트
  updateTakeCount() {
    const count = this.preTakes ? this.preTakes.length : 0;
    
    // 총 글자수 계산
    let totalCharacters = 0;
    if (this.preTakes && this.preTakes.length > 0) {
      totalCharacters = this.preTakes.reduce((sum, take) => sum + (take.text ? take.text.length : 0), 0);
    }
    
    // 우상단 테이크 플로팅 업데이트
    if (this.takeCountLabel) {
      this.takeCountLabel.textContent = `${count}개 테이크 수집`;
    }
    
    // 하단 플로팅 업데이트 (문단 수 + 총 글자수)
    if (this.bottomTakeCountLabel) {
      this.bottomTakeCountLabel.textContent = `${count}개 문단 / ${totalCharacters}자`;
    }
  }

  // 🎯 새로운 키보드 단축키 설정 (마우스 위치 기반)
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // 플러그인이 비활성화된 경우 모든 단축키 무시
      if (!this.isPluginEnabled) {
        return;
      }
      
      // 🎯 입력 필드에서 스페이스바 처리 개선
      if (this.isInputField(event.target)) {
        // 입력 필드에서는 스페이스바 기본 동작 허용
        if (event.key === ' ') {
          return;
        }
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
      } else if (key === ' ') {
        // 🤖 Zeta AI / ChatGPT에서는 스페이스바 기능 비활성화
        if (!this.isZetaOrChatGPTMode()) {
          // 🎯 스페이스바로 하단 플로팅바 재생/일시정지 토글
          this.handleSpacebarToggle();
          event.preventDefault();
        }
      } else if (key === 'Enter') {
        // 🤖 Zeta AI / ChatGPT: 엔터키 입력 감지 (화자 구분용) - 포괄적 감지
        this.handleZetaAIEnterKey();
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

  // 🎯 입력 필드 판단 (스페이스바 예외 처리용)
  isInputField(element) {
    if (!element) return false;
    
    // 기본 입력 요소들
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      return true;
    }
    
    // contenteditable 요소들
    if (element.contentEditable === 'true') {
      return true;
    }
    
    // 특정 역할을 가진 요소들
    const role = element.getAttribute('role');
    if (role === 'textbox' || role === 'searchbox' || role === 'combobox') {
      return true;
    }
    
    // 특정 클래스나 ID를 가진 요소들
    const className = element.className?.toLowerCase() || '';
    const elementId = element.id?.toLowerCase() || '';
    
    const inputKeywords = [
      'input', 'textarea', 'editor', 'composer', 'comment', 'reply',
      'search', 'form', 'chat', 'message', 'note', 'code'
    ];
    
    if (inputKeywords.some(keyword => 
      className.includes(keyword) || elementId.includes(keyword)
    )) {
      return true;
    }
    
    return false;
  }

  // 🤖 Zeta AI / ChatGPT: 포괄적 엔터키 감지 시스템 설정
  setupZetaAIEnterKeyDetection() {
    if (!this.isZetaOrChatGPTMode()) {
      return; // Zeta AI / ChatGPT 사이트가 아니면 설정하지 않음
    }
    
    this.log('🤖 Zeta AI: 포괄적 엔터키 감지 시스템 설정 시작');
    
    // 1. 전역 keydown 이벤트 (이미 설정됨)
    // 2. 전역 keypress 이벤트 추가
    document.addEventListener('keypress', (event) => {
      if (event.key === 'Enter' || event.keyCode === 13) {
        this.handleZetaAIEnterKey();
      }
    }, true); // 캡처링 단계에서 감지
    
    // 3. 전역 keyup 이벤트 추가
    document.addEventListener('keyup', (event) => {
      if (event.key === 'Enter' || event.keyCode === 13) {
        this.handleZetaAIEnterKey();
      }
    }, true); // 캡처링 단계에서 감지
    
    // 4. MutationObserver로 DOM 변경 감지 (React 등에서 동적으로 생성되는 입력 필드용)
    this.setupZetaAIMutationObserver();
    
    // 5. 주기적 입력 필드 스캔 (백업용)
    this.startZetaAIInputFieldScanning();
    
    this.log('🤖 Zeta AI / ChatGPT: 포괄적 엔터키 감지 시스템 설정 완료');
  }

  // 🤖 Zeta AI / ChatGPT: MutationObserver 설정 (동적 입력 필드 감지용)
  setupZetaAIMutationObserver() {
    if (!this.isZetaOrChatGPTMode()) {
      return;
    }
    
    // DOM 변경 감지
    this.zetaAIMutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // 새로 추가된 입력 필드들에 엔터키 이벤트 리스너 추가
              this.addEnterKeyListenersToElement(node);
            }
          });
        }
      });
    });
    
    // body 전체 감시
    this.zetaAIMutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    this.log('🤖 Zeta AI / ChatGPT: MutationObserver 설정 완료');
  }

  // 🤖 Zeta AI / ChatGPT: 요소에 엔터키 리스너 추가
  addEnterKeyListenersToElement(element) {
    if (!element || !this.isZetaOrChatGPTMode()) {
      return;
    }
    
    // 입력 필드인지 확인
    if (this.isInputField(element)) {
      // keydown, keypress, keyup 모두 추가
      ['keydown', 'keypress', 'keyup'].forEach(eventType => {
        element.addEventListener(eventType, (event) => {
          if (event.key === 'Enter' || event.keyCode === 13) {
            this.handleZetaAIEnterKey();
          }
        }, true);
      });
      
      this.log('🤖 Zeta AI / ChatGPT: 입력 필드에 엔터키 리스너 추가:', element.tagName, element.className);
    }
    
    // 자식 요소들도 재귀적으로 처리
    if (element.children) {
      Array.from(element.children).forEach(child => {
        this.addEnterKeyListenersToElement(child);
      });
    }
  }

  // 🤖 Zeta AI / ChatGPT: 주기적 입력 필드 스캔 (백업용)
  startZetaAIInputFieldScanning() {
    if (!this.isZetaOrChatGPTMode()) {
      return;
    }
    
    // 2초마다 모든 입력 필드를 스캔하여 엔터키 리스너 추가
    this.zetaAIInputScanInterval = setInterval(() => {
      const inputElements = document.querySelectorAll('input, textarea, [contenteditable="true"], [role="textbox"]');
      
      inputElements.forEach(element => {
        // 이미 리스너가 추가되었는지 확인
        if (!element.hasAttribute('data-zeta-enter-listener')) {
          this.addEnterKeyListenersToElement(element);
          element.setAttribute('data-zeta-enter-listener', 'true');
        }
      });
    }, 2000);
    
    this.log('🤖 Zeta AI / ChatGPT: 주기적 입력 필드 스캔 시작');
  }

  // 🤖 Zeta AI / ChatGPT 엔터키 처리 (화자 구분용)
  handleZetaAIEnterKey() {
    // 플러그인이 비활성화된 경우 엔터키 처리 중지
    if (!this.isPluginEnabled) {
      return;
    }
    
    if (!this.isZetaOrChatGPTMode()) {
      return; // Zeta AI / ChatGPT 사이트가 아니면 무시
    }
    
    // 중복 감지 방지 (100ms 내 중복 호출 무시)
    const currentTime = Date.now();
    if (this.lastEnterKeyTime && (currentTime - this.lastEnterKeyTime) < 100) {
      return;
    }
    this.lastEnterKeyTime = currentTime;
    
    // 엔터키 입력 플래그를 true로 설정
    this.zetaAIEnterFlag = true;
    
    this.log('🤖 Zeta AI / ChatGPT 엔터키 감지: 플래그 true로 설정');
    this.log('🤖 Zeta AI / ChatGPT 감지 위치:', event?.target?.tagName, event?.target?.className);
  }

  // 🤖 Zeta AI / ChatGPT 화자 구분 로직
  determineZetaAISpeaker() {
    if (!this.isZetaOrChatGPTMode()) {
      return; // Zeta AI / ChatGPT 사이트가 아니면 무시
    }
    
    // 엔터키 플래그가 true인 경우에만 화자1로 변경
    if (this.zetaAIEnterFlag) {
      this.zetaAICurrentSpeaker = 'speaker1';
      this.log('🤖 Zeta AI / ChatGPT 화자1 감지: 엔터키 플래그 true');
      // 플래그를 false로 변경 (다음 테이크부터는 화자2)
      this.zetaAIEnterFlag = false;
    } else {
      // 엔터키 플래그가 false인 경우 화자2 (기본값)
      if (!this.zetaAICurrentSpeaker || this.zetaAICurrentSpeaker === 'speaker1') {
        this.zetaAICurrentSpeaker = 'speaker2';
        this.log('🤖 Zeta AI / ChatGPT 화자2 감지: 엔터키 플래그 false');
      }
    }
    
    const currentVoice = this.zetaAICurrentSpeaker === 'speaker1' ? 
      this.zetaAISpeaker1Voice : this.zetaAISpeaker2Voice;
    
    this.log(`🤖 Zeta AI / ChatGPT 최종 결정: ${this.zetaAICurrentSpeaker} (${currentVoice.name})`);
  }

  // 🎯 스페이스바 토글 처리 (하단 플로팅바와 동일한 로직)
  async handleSpacebarToggle() {
    // 플러그인이 비활성화된 경우 토글 중지
    if (!this.isPluginEnabled) {
      return;
    }
    
    this.log('🎯 스페이스바 토글 처리');
    
    // 현재 재생 중인 경우
    if (this.isPlaying) {
      if (this.isPaused) {
        // 일시정지 상태면 재생 재개
        this.log('▶️ 스페이스바: 재생 재개');
        this.resumePlayback();
      } else {
        // 재생 중이면 일시정지
        this.log('⏸️ 스페이스바: 일시정지');
        this.pausePlayback();
      }
    } else {
      // 정지 상태면 '읽어 보세요' 기능 실행
      this.log('🎯 스페이스바: 읽어 보세요 기능 실행');
      await this.startReadingFromFirst();
    }
  }
  
  // 🎯 음성 선택 후 마우스 위치에서 테이크 재생 시작
  async selectVoiceAndStartFromMousePosition(voiceIndex) {
    // 음성 선택
    if (voiceIndex >= 0 && voiceIndex < this.VOICES.length) {
      const previousVoiceId = this.selectedVoice.id;
      const newVoice = this.VOICES[voiceIndex];
      
      this.selectedVoice = newVoice;
      
      // 화자 설정 저장
      await this.saveVoiceSetting(newVoice);
      
      this.log(`🎵 단축키로 음성 선택: ${this.selectedVoice.name}`);
      
      // 하단 플로팅 UI 업데이트
      this.updateBottomFloatingUIState();
      
      // 🎤 화자가 변경된 경우 버퍼링 제거 및 재시작 처리
      if (previousVoiceId !== newVoice.id) {
        // 현재 재생 중이면 현재 테이크부터 새 목소리로 재시작
        if (this.isPlaying && this.currentPlayList && this.currentPlayList.length > 0) {
          this.log(`🎤 단축키로 화자 변경: 현재 테이크부터 새 목소리로 재시작`);
          this.clearAllBuffering();
          
          if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
          }
          
          this.isPlaying = false;
          this.isPaused = false;
          
          // 현재 테이크부터 새 목소리로 재시작
          setTimeout(() => {
            this.playTakeAtIndex(this.currentTakeIndex);
          }, 300);
          
          return; // 마우스 위치 기반 재생은 하지 않음
        }
      }
      
      // 🎯 마우스 위치에서 테이크 찾기 (새로운 재생 시작)
      const takeAtMouse = this.findTakeAtMousePosition();
      
      if (takeAtMouse) {
        this.log(`🎯 마우스 위치에서 테이크 발견: ${takeAtMouse.id}`);
        await this.startPlaybackFromTake(takeAtMouse);
      } else {
        this.log('🚫 마우스 위치에 테이크가 없습니다');
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
    
    this.log(`🔍 마우스 위치 요소: <${elementAtMouse.tagName.toLowerCase()}>`);
    
    // 해당 요소나 부모 요소가 테이크에 해당하는지 확인
    let currentElement = elementAtMouse;
    
    while (currentElement && currentElement !== document.body) {
      // 현재 요소가 테이크 요소인지 확인
      const foundTake = this.preTakes.find(take => take.element === currentElement);
      
      if (foundTake) {
        this.log(`✅ 테이크 발견: ${foundTake.id} (${foundTake.text.substring(0, 30)}...)`);
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
      this.log(`📍 가장 가까운 테이크: ${closestTake.id} (거리: ${minDistance}px)`);
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
    this.log(`🎬 재생 시작: ${startTake.id} (${startTake.text.substring(0, 30)}...)`);
    
    // 이전 재생 중지
    this.stopAll();
    
    // 재생할 테이크 목록 설정 (시작 테이크부터 끝까지)
    const startIndex = this.preTakes.findIndex(take => take.id === startTake.id);
    this.currentPlayList = this.preTakes.slice(startIndex);
    this.currentTakeIndex = 0;
    this.currentPlayingTakeId = startTake.id;
    
    this.log(`📋 재생 목록: ${this.currentPlayList.length}개 테이크 (${startIndex + 1}번째부터)`);
    
    // UI 업데이트
    this.updateStatus(`재생 준비 중... (${startIndex + 1}/${this.preTakes.length})`, '#FF9800');
    this.updatePlaybackUI(startTake);
    
    // 🎯 첫 번째 테이크 재생 시작 (버퍼링은 생성 완료 후)
    await this.playTakeAtIndex(0);
  }
  
  // 🎯 인덱스에 해당하는 테이크 재생
  async playTakeAtIndex(playListIndex) {
    if (!this.currentPlayList || playListIndex >= this.currentPlayList.length) {
      this.log('✅ 모든 테이크 재생 완료');
      this.updateStatus('재생 완료', '#4CAF50');
      return;
    }
    
    const take = this.currentPlayList[playListIndex];
    this.currentTakeIndex = playListIndex;
    this.currentPlayingTakeId = take.id;
    
    this.log(`🎵 테이크 재생: ${take.id} (${playListIndex + 1}/${this.currentPlayList.length})`);
    
    // UI 업데이트
    this.updatePlaybackUI(take);
    this.updateStatus(`재생 중... (${playListIndex + 1}/${this.currentPlayList.length})`, '#4CAF50');
    
    try {
      let audioUrl;
      
      // 🚀 이미 버퍼링된 경우 바로 재생
      if (take.isBuffered && take.audioUrl) {
        this.log(`🎯 버퍼링된 오디오 즉시 재생: ${take.id}`);
        audioUrl = take.audioUrl;
      } else {
        // 버퍼링되지 않은 경우 생성 (재생을 위한 생성)
        this.log(`🔄 테이크 실시간 생성: ${take.id}`);
        this.updateStatus(`음성 생성 중... (${playListIndex + 1}/${this.currentPlayList.length})`, '#FF9800');
        
        // 🎯 재생을 위한 생성 시 해당 테이크 위치로 자동 스크롤
        if (take.element) {
          this.log(`📜 재생을 위한 생성 - 테이크 위치로 스크롤: <${take.element.tagName.toLowerCase()}>`);
          take.element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
        
        // 🎯 현재 재생 테이크에도 버퍼링 애니메이션 적용
        this.log(`🎭 현재 재생 테이크 애니메이션 시작: ${take.id}`);
        this.applyBufferingAnimation(take.element);
        
        try {
          audioUrl = await this.convertToSpeech(take);
          if (audioUrl) {
            take.audioUrl = audioUrl;
            take.isBuffered = true;
          }
        } finally {
          // 🎯 생성 완료 후 애니메이션 제거
          this.log(`🎭 현재 재생 테이크 애니메이션 종료: ${take.id}`);
          this.removeBufferingAnimation(take.element);
        }
        
        // 🎯 현재 테이크 생성 완료 후 연속적 버퍼링 확인
        if (audioUrl) {
          this.log(`✅ ${playListIndex + 1}번째 테이크 생성 완료 - 연속적 버퍼링 확인`);
          this.maintainContinuousBuffering(playListIndex);
        }
      }
      
      if (audioUrl) {
        await this.playAudioWithTracking(audioUrl, take);
      } else {
        this.error(`❌ 테이크 재생 실패: ${take.id}`);
        // 다음 테이크로 넘어가기
        await this.playTakeAtIndex(playListIndex + 1);
      }
      
    } catch (error) {
      this.error(`❌ 테이크 재생 오류: ${take.id}`, error);
      await this.playTakeAtIndex(playListIndex + 1);
    }
  }
  
  // 🎯 연속적 버퍼링 유지 (현재 테이크 기준 뒤 3개 항상 유지)
  maintainContinuousBuffering(currentIndex) {
    this.log(`🔄 연속적 버퍼링 확인: ${currentIndex + 1}번째 테이크 기준`);
    
    const bufferAhead = 3; // 현재 테이크 뒤로 3개 유지
    const maxBufferIndex = Math.min(currentIndex + bufferAhead, this.currentPlayList.length - 1);
    
    this.log(`📊 버퍼링 확인 범위: ${currentIndex + 1} ~ ${maxBufferIndex + 1}번째 테이크`);
    
    // 🎯 현재 테이크 뒤 3개 중 버퍼링되지 않은 것들 찾기
    const unbufferedTakes = [];
    
    for (let i = currentIndex + 1; i <= maxBufferIndex; i++) {
      const take = this.currentPlayList[i];
      
      if (!take.isBuffered && !this.bufferingTakes.has(take.id)) {
        unbufferedTakes.push({
          take: take,
          index: i
        });
        this.log(`🔍 버퍼링 필요: ${i + 1}번째 테이크 "${take.id}"`);
      } else {
        this.log(`✅ 이미 버퍼링됨: ${i + 1}번째 테이크 "${take.id}"`);
      }
    }
    
    // 🎯 필요한 테이크들만 순차적으로 버퍼링
    if (unbufferedTakes.length > 0) {
      this.log(`🔄 ${unbufferedTakes.length}개 테이크 순차 버퍼링 시작`);
      this.bufferTakesSequentially(unbufferedTakes, 0);
    } else {
      this.log(`✅ 모든 필요한 테이크가 이미 버퍼링됨`);
    }
  }
  
  // 🎯 테이크들을 순차적으로 버퍼링 (연속적)
  async bufferTakesSequentially(unbufferedTakes, index) {
    if (index >= unbufferedTakes.length) {
      this.log(`✅ 순차 버퍼링 완료: ${unbufferedTakes.length}개 테이크`);
      return;
    }
    
    const { take, index: takeIndex } = unbufferedTakes[index];
    
    // 이미 버퍼링 중이거나 완료된 경우 스킵
    if (take.isBuffered || this.bufferingTakes.has(take.id)) {
      this.log(`⏭️ 버퍼링 스킵: ${takeIndex + 1}번째 테이크 "${take.id}" (이미 처리됨)`);
      setTimeout(() => {
        this.bufferTakesSequentially(unbufferedTakes, index + 1);
      }, 50);
      return;
    }
    
    // 버퍼링 시작
    this.bufferingTakes.add(take.id);
    this.log(`🔄 순차 버퍼링: ${takeIndex + 1}번째 테이크 "${take.id}" (${index + 1}/${unbufferedTakes.length})`);
    
    // 🎯 버퍼링 애니메이션 적용
    this.applyBufferingAnimation(take.element);
    
    try {
      const audioUrl = await this.convertToSpeech(take);
      if (audioUrl) {
        take.audioUrl = audioUrl;
        take.isBuffered = true;
        this.log(`✅ 순차 버퍼링 완료: ${takeIndex + 1}번째 "${take.id}" → 다음 테이크`);
      } else {
        this.error(`❌ 순차 버퍼링 실패: ${takeIndex + 1}번째 "${take.id}"`);
      }
    } catch (error) {
      this.error(`❌ 순차 버퍼링 오류: ${takeIndex + 1}번째 "${take.id}"`, error);
    } finally {
      this.bufferingTakes.delete(take.id);
      this.removeBufferingAnimation(take.element);
    }
    
    // 🔗 다음 테이크 버퍼링 (짧은 간격 후)
    setTimeout(() => {
      this.bufferTakesSequentially(unbufferedTakes, index + 1);
    }, 100);
  }
  

  
  // 🎯 App.js 스타일 버퍼링 알파값 애니메이션 적용
  applyBufferingAnimation(element) {
    if (!element) {
      this.warn('⚠️ 애니메이션 적용 실패: 요소가 없음');
      return;
    }
    
    this.log(`🎭 버퍼링 애니메이션 적용 시작: <${element.tagName.toLowerCase()}> ${element.className || 'no-class'}`);
    
    // 기존 애니메이션 제거
    element.style.animation = '';
    
    // CSS 애니메이션이 없으면 스타일시트에 추가
    if (!document.querySelector('#tts-buffering-animation')) {
      this.log('📝 CSS 애니메이션 스타일시트 추가');
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
    
    // App.js의 fadeInOut 애니메이션 적용
    element.style.animation = 'tts-buffering 3s infinite';
    this.log(`✅ 애니메이션 적용 완료: ${element.style.animation}`);
    
    // 실제 적용 확인 (약간 지연 후)
    setTimeout(() => {
      const computedStyle = window.getComputedStyle(element);
      const appliedAnimation = computedStyle.animation;
      this.log(`🔍 애니메이션 적용 확인: ${appliedAnimation !== 'none' ? '✅ 성공' : '❌ 실패'}`);
      this.log(`📊 현재 opacity: ${computedStyle.opacity}`);
    }, 100);
  }
  
  // 🎯 버퍼링 애니메이션 제거
  removeBufferingAnimation(element) {
    if (!element) {
      this.warn('⚠️ 애니메이션 제거 실패: 요소가 없음');
      return;
    }
    
    this.log(`🎭 버퍼링 애니메이션 제거: <${element.tagName.toLowerCase()}> ${element.className || 'no-class'}`);
    
    element.style.animation = '';
    element.style.opacity = '';
    
    this.log(`✅ 애니메이션 제거 완료`);
  }
  
  // 🎯 오디오 재생 + App.js 스타일 단어 트래킹
  async playAudioWithTracking(audioUrl, take) {
    return new Promise((resolve, reject) => {
      this.currentAudio = new Audio(audioUrl);
      this.isPlaying = true;
      this.isPaused = false;
      
      // 하단 플로팅 UI 상태 업데이트
      this.updateBottomFloatingUIState();
      
      this.log(`🎵 오디오 재생 시작: ${take.id}`);
      
      // 🎯 App.js 스타일 단어 트래킹 준비
      this.prepareWordTracking(take);
      
      this.currentAudio.onloadedmetadata = () => {
        this.log(`📊 오디오 메타데이터 로드 완료 - 길이: ${this.currentAudio.duration}초`);
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
        this.log(`✅ 테이크 재생 완료: ${take.id}`);
        
        // 단어 트래킹 정리
        this.cleanupWordTracking();
        
        // 🎯 테이크 종료 후 0.5초 지연
        setTimeout(() => {
          const nextIndex = this.currentTakeIndex + 1;
          if (nextIndex < this.currentPlayList.length) {
            // 다음 테이크가 있으면 연속 재생 (재생 상태 유지)
            this.playTakeAtIndex(nextIndex);
            // 🎯 다음 테이크 재생 시작과 동시에 연속적 버퍼링 확인
            this.maintainContinuousBuffering(nextIndex);
          } else {
            // 모든 테이크 재생 완료 시에만 상태 변경
            this.log('🎉 모든 테이크 재생 완료');
            this.isPlaying = false;
            this.isPaused = false;
            this.updateBottomFloatingUIState();
            this.updateStatus('재생 완료', '#4CAF50');
          }
          resolve();
        }, 500); // 0.5초 지연
      };
      
      this.currentAudio.onerror = (error) => {
        this.error(`❌ 오디오 재생 오류: ${take.id}`, error);
        this.isPlaying = false;
        this.isPaused = false;
        this.updateStatus('재생 오류', '#F44336');
        this.stopWordTracking();
        
        // 하단 플로팅 UI 상태 업데이트
        this.updateBottomFloatingUIState();
        
        reject(error);
      };
      
      this.currentAudio.play().catch(reject);
    });
  }
  
  // 🎯 오버레이 단어 트래킹 준비 (모든 사이트 공통)
  prepareWordTracking(take) {
    this.log(`🎨 오버레이 단어 트래킹 준비 시작: ${take.id}`);
    
    // 기존 트래킹 정리
    this.cleanupWordTracking();
    
    // 🎯 모든 사이트에서 오버레이 모드 사용 (DOM 조작 없음)
    this.currentTakeWords = this.splitIntoWords(take.text, take.language);
    this.currentTakeWordElements = []; // DOM 조작 없으므로 항상 빈 배열
    
    // 오버레이 트래킹 설정
    this.setupOverlayWordTracking(take);
    
    this.log(`🎨 오버레이 트래킹 준비 완료: ${this.currentTakeWords.length}개 단어`);
  }
  
  // 🛡️ DOM 조작이 안전한지 체크하는 메서드 (BBC 예외 처리 포함)
  isSafeForDOMManipulation() {
    const hostname = window.location.hostname.toLowerCase();
    
    // 🎯 BBC 사이트는 특별 처리 - 제한적 DOM 조작 허용
    const isBBC = hostname.includes('bbc.com') || hostname.includes('bbc.co.uk');
    if (isBBC) {
      this.log(`🔵 BBC 사이트 감지: 제한적 DOM 조작 모드 사용`);
      return this.isSafeForBBCManipulation();
    }
    
    // 🎯 매우 복잡한 레이아웃만 제한 (기준 완화됨)
    const hasVeryComplexLayout = this.detectComplexLayout();
    if (hasVeryComplexLayout) {
      this.log(`🚫 매우 복잡한 CSS 레이아웃 감지: DOM 조작 비활성화`);
      return false;
    }
    
    // 🎯 기본적으로 DOM 조작 허용 (안전한 방향으로 변경)
    this.log(`✅ DOM 조작 허용: ${hostname}`);
    return true;
  }
  
  // 🔵 BBC 사이트용 안전한 DOM 조작 체크
  isSafeForBBCManipulation() {
    try {
      // BBC 페이지에서 텍스트 콘텐츠 영역만 대상으로 제한
      const articleContent = document.querySelector('article, [data-component="text-block"], .story-body, .gel-body-copy');
      
      if (!articleContent) {
        this.log('🔵 BBC: 안전한 텍스트 영역을 찾을 수 없음 - 오버레이 모드 사용');
        return false; // DOM 조작 차단, 오버레이 모드로 전환
      }
      
      // 🚫 BBC에서는 DOM 조작 완전 차단, 대신 오버레이 사용
      this.log('🔵 BBC: DOM 조작 차단 - 오버레이 모드로 전환');
      return false;
      
    } catch (error) {
      this.warn('🔵 BBC: 안전성 체크 실패:', error);
      return false;
    }
  }
  
  // 🔍 복잡한 CSS 레이아웃 감지 (완화된 기준)
  detectComplexLayout() {
    try {
      // 🎯 더 관대한 기준으로 수정
      
      // 1. 매우 복잡한 Grid 레이아웃 체크 (기준 완화)
      const complexGridElements = document.querySelectorAll('[style*="grid-template"], [class*="grid-container"], [class*="grid-system"]');
      if (complexGridElements.length > 15) { // 5 → 15로 완화
        this.log('매우 복잡한 Grid 레이아웃 감지');
        return true;
      }
      
      // 2. CSS Flexbox는 일반적이므로 더 관대하게
      const complexFlexElements = document.querySelectorAll('[style*="flex-direction"], [style*="flex-wrap"], [class*="flex-container"]');
      if (complexFlexElements.length > 25) { // 10 → 25로 완화
        this.log('매우 복잡한 Flexbox 레이아웃 감지');
        return true;
      }
      
      // 3. CSS 변수 체크 제거 (너무 일반적임)
      // CSS 변수는 현재 거의 모든 사이트에서 사용되므로 체크 제거
      
      // 4. 특정 문제가 되는 CSS 프레임워크 감지
      const hasProblematicFramework = this.detectProblematicFrameworks();
      if (hasProblematicFramework) {
        this.log('문제가 되는 CSS 프레임워크 감지');
        return true;
      }
      
      return false;
    } catch (error) {
      this.warn('레이아웃 감지 실패:', error);
      // 에러 시 안전하게 false 반환 (DOM 조작 허용)
      return false;
    }
  }
  
  // 🔍 문제가 되는 CSS 프레임워크 감지
  detectProblematicFrameworks() {
    try {
      // Bootstrap Grid의 복잡한 버전
      const hasComplexBootstrap = document.querySelectorAll('.container-fluid, .row-cols-, .g-').length > 20;
      
      // Tailwind CSS의 복잡한 Grid 시스템
      const hasComplexTailwind = document.querySelectorAll('[class*="grid-cols-"], [class*="grid-rows-"]').length > 15;
      
      // CSS-in-JS 라이브러리 (Styled Components 등)
      const hasCSSinJS = document.querySelectorAll('[data-styled], [class^="sc-"]').length > 10;
      
      return hasComplexBootstrap || hasComplexTailwind || hasCSSinJS;
    } catch (error) {
      return false;
    }
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
    this.log(`🎯 App.js 스타일 단어 트래킹 시작: ${take.id}`);
    
    // 🎯 테이크 시작 시 한 번만 스크롤
    if (take.element) {
      this.log(`📜 테이크 시작 - 요소로 스크롤: <${take.element.tagName.toLowerCase()}>`);
      take.element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }
  }
  
  // 🎯 오버레이 단어 트래킹 업데이트 (모든 사이트 공통)
  updateAppJsStyleWordTracking(take) {
    if (!this.currentAudio || !this.currentTakeWords || this.currentTakeWords.length === 0) {
      return;
    }
    
    const currentTime = this.currentAudio.currentTime;
    const duration = this.currentAudio.duration;
    
    // App.js의 calculateCurrentWordIndex 로직
    const currentWordIndex = this.calculateCurrentWordIndex(currentTime, duration, this.currentTakeWords);
    
    // 🎯 오버레이 모드로 단어 하이라이트 (모든 사이트)
    if (this.overlayHighlight) {
      this.updateOverlayWordHighlight(currentWordIndex);
    }
    
    // UI 업데이트
    if (currentWordIndex >= 0 && currentWordIndex < this.currentTakeWords.length) {
      const currentWord = this.currentTakeWords[currentWordIndex]?.text || '';
      this.updateWordInfo(currentWordIndex + 1, this.currentTakeWords.length, currentWord);
    }
  }
  
  // 🎯 DOM 모드에서 단어 하이라이트 업데이트
  updateDOMWordHighlight(currentWordIndex) {
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
      }
    }
  }
  
  // 🎯 App.js의 calculateCurrentWordIndex 로직 재현
  calculateCurrentWordIndex(currentTime, duration, words) {
    if (!duration || !words || words.length === 0) return 0;
    
    const totalDuration = duration;
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
    
    this.log(`🔤 단어 래핑 시작: ${targetText.substring(0, 50)}...`);
    
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
    
    this.log(`✅ 단어 래핑 완료: ${this.currentTakeWordElements.length}개 span 생성`);
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
  
  // 🔵 BBC 전용 안전한 단어 래핑 메서드
  wrapWordsInElementSafely(element, targetText) {
    if (!element || !targetText) return;
    
    this.log(`🔵 BBC 안전 래핑 시작: ${targetText.substring(0, 50)}...`);
    
    try {
      // BBC 페이지에서 안전한 텍스트 노드만 선택
      const safeTextNodes = this.findSafeBBCTextNodes(element, targetText);
      this.log(`🔵 BBC: ${safeTextNodes.length}개 안전한 텍스트 노드 발견`);
      
      // 각 텍스트 노드를 안전하게 래핑
      for (const textNode of safeTextNodes) {
        this.wrapSingleTextNodeSafely(textNode);
      }
      
      this.log(`🔵 BBC 안전 래핑 완료: ${this.currentTakeWordElements.length}개 span 생성`);
      
    } catch (error) {
      this.error('🔵 BBC 안전 래핑 실패:', error);
      this.currentTakeWordElements = [];
    }
  }
  
  // 🔵 BBC에서 안전한 텍스트 노드 찾기
  findSafeBBCTextNodes(element, targetText) {
    const safeNodes = [];
    
    // BBC 특화 안전 영역들
    const bbcSafeSelectors = [
      'p', // 문단
      '[data-component="text-block"] p',
      '.story-body p',
      '.gel-body-copy p',
      'article p',
      '.qa-story-body p'
    ];
    
    // 안전한 문단들만 선택
    for (const selector of bbcSafeSelectors) {
      try {
        const safeParagraphs = element.querySelectorAll ? 
          element.querySelectorAll(selector) : 
          [element].filter(el => el.matches && el.matches(selector));
          
        for (const paragraph of safeParagraphs) {
          // 각 문단의 텍스트 노드들 수집
          const walker = document.createTreeWalker(
            paragraph,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
                // 텍스트가 있고, BBC 위험 요소가 아닌 노드만
                if (node.textContent.trim().length === 0) return NodeFilter.FILTER_REJECT;
                
                // 부모가 버튼이나 링크가 아닌지 확인
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                
                const parentTag = parent.tagName.toLowerCase();
                if (['button', 'a', 'nav', 'header', 'footer'].includes(parentTag)) {
                  return NodeFilter.FILTER_REJECT;
                }
                
                return NodeFilter.FILTER_ACCEPT;
              }
            }
          );
          
          let textNode;
          while (textNode = walker.nextNode()) {
            safeNodes.push(textNode);
          }
        }
      } catch (error) {
        this.warn(`🔵 BBC 선택자 "${selector}" 처리 실패:`, error);
      }
    }
    
    return safeNodes;
  }
  
  // 🔵 BBC용 안전한 단일 텍스트 노드 래핑
  wrapSingleTextNodeSafely(textNode) {
    try {
      const text = textNode.textContent;
      const words = text.split(/(\s+)/);
      
      if (words.length <= 1) return;
      
      const fragment = document.createDocumentFragment();
      
      for (const word of words) {
        if (word.trim().length > 0) {
          const span = document.createElement('span');
          span.textContent = word;
          // BBC용 특별 클래스 (더 안전한 스타일 적용)
          span.className = 'tts-word-appjs tts-word-bbc-safe';
          this.currentTakeWordElements.push(span);
          fragment.appendChild(span);
        } else {
          fragment.appendChild(document.createTextNode(word));
        }
      }
      
      // 안전한 교체
      if (textNode.parentNode) {
        textNode.parentNode.replaceChild(fragment, textNode);
      }
      
    } catch (error) {
      this.warn('🔵 BBC 텍스트 노드 래핑 실패:', error);
    }
  }
  
  // 🎯 오버레이 단어 트래킹 정리 (모든 사이트 공통)
  cleanupWordTracking() {
    this.log('🧹 오버레이 트래킹 정리 시작');
    
    // 🛡️ 매우 엄격한 DOM 정리 - 우리가 생성한 요소만 정리
    this.safeCleanupTTSElements();
    
    // 🎯 오버레이 하이라이트 제거
    this.removeOverlayHighlight();
    
    // 배열 초기화
    this.currentTakeWords = [];
    this.currentTakeWordElements = [];
    
    this.log('✅ 오버레이 트래킹 정리 완료');
  }
  
  // 🛡️ 매우 안전한 TTS 요소 정리 (엄격한 검증)
  safeCleanupTTSElements() {
    try {
      // 🔍 우리가 생성한 TTS 요소들만 엄격하게 선별
      const ttsElements = document.querySelectorAll('[class*="tts-"]');
      this.log(`🔍 발견된 TTS 관련 요소: ${ttsElements.length}개`);
      
      let cleanedCount = 0;
      
      ttsElements.forEach((element, index) => {
        try {
          // 🛡️ 엄격한 검증: 우리가 생성한 요소인지 확인
          if (this.isSafeTTSElement(element)) {
            const parent = element.parentNode;
            const textContent = element.textContent;
            
            if (parent && textContent) {
              // 🔄 안전한 텍스트 노드로 교체
              const textNode = document.createTextNode(textContent);
              parent.replaceChild(textNode, element);
              cleanedCount++;
              
              this.log(`🧹 안전하게 정리됨 ${cleanedCount}: "${textContent.substring(0, 20)}..."`);
            }
          } else {
            this.warn(`⚠️ 안전하지 않은 요소 발견, 건너뛰기: ${element.className}`);
          }
          
        } catch (elementError) {
          this.warn(`⚠️ 요소 ${index + 1} 정리 중 오류 (안전하게 건너뛰기):`, elementError);
        }
      });
      
      this.log(`✅ 총 ${cleanedCount}개 TTS 요소 안전하게 정리됨`);
      
    } catch (error) {
      this.error('🚨 DOM 정리 중 치명적 오류 (안전하게 무시):', error);
    }
  }
  
  // 🔍 안전한 TTS 요소인지 엄격하게 검증
  isSafeTTSElement(element) {
    if (!element || !element.className) {
      return false;
    }
    
    // 🛡️ 우리가 생성한 TTS 클래스만 허용
    const safeTTSClasses = [
      'tts-word-appjs',
      'tts-current-word-appjs', 
      'tts-word-bbc-safe'
    ];
    
    // 정확한 클래스 매칭 (부분 매칭 방지)
    const elementClasses = element.className.split(/\s+/);
    const hasSafeTTSClass = elementClasses.some(cls => safeTTSClasses.includes(cls));
    
    if (!hasSafeTTSClass) {
      return false;
    }
    
    // 🔍 추가 안전성 검사
    const tagName = element.tagName.toLowerCase();
    if (tagName !== 'span') {
      this.warn(`⚠️ 예상치 못한 태그: ${tagName}, TTS span이어야 함`);
      return false;
    }
    
    // 🔍 부모 요소 검증
    const parent = element.parentNode;
    if (!parent || parent === document) {
      this.warn(`⚠️ 잘못된 부모 요소 구조`);
      return false;
    }
    
    // 🔍 텍스트 콘텐츠 검증
    const textContent = element.textContent;
    if (!textContent || textContent.length === 0) {
      this.warn(`⚠️ 빈 텍스트 콘텐츠`);
      return false;
    }
    
    return true;
  }
  
  // 🎯 오버레이 모드 단어 트래킹 설정 (DOM 조작 없음)
  setupOverlayWordTracking(take) {
    this.log(`🎨 오버레이 모드 단어 트래킹 설정: ${take.id}`);
    
    this.currentOverlayTake = take;
    this.overlayWordIndex = 0;
    
    // 오버레이 하이라이트 엘리먼트 생성
    this.createOverlayHighlight();
    
    this.log(`🎨 오버레이 모드 준비 완료: ${this.currentTakeWords.length}개 단어`);
  }
  
  // 🎨 오버레이 하이라이트 엘리먼트 생성
  createOverlayHighlight() {
    // 기존 오버레이 제거
    this.removeOverlayHighlight();
    
    this.overlayHighlight = document.createElement('div');
    this.overlayHighlight.id = 'tts-overlay-highlight';
    this.overlayHighlight.style.cssText = `
      position: absolute !important;
      pointer-events: none !important;
      z-index: 99996 !important;
      background: rgba(34, 124, 255, 0.1) !important;
      border-bottom: 2px solid #227cff !important;
      border-radius: 0px !important;
      transition: all 0.2s ease !important;
      display: none !important;
    `;
    
    document.body.appendChild(this.overlayHighlight);
    this.log('🎨 오버레이 하이라이트 엘리먼트 생성');
  }
  
  // 🎨 오버레이 하이라이트 제거
  removeOverlayHighlight() {
    if (this.overlayHighlight) {
      this.overlayHighlight.remove();
      this.overlayHighlight = null;
      this.log('🎨 오버레이 하이라이트 제거');
    }
  }
  
  // 🎯 오버레이 모드에서 현재 단어 하이라이트
  updateOverlayWordHighlight(wordIndex) {
    if (!this.overlayHighlight || !this.currentOverlayTake || !this.currentTakeWords) {
      return;
    }
    
    if (wordIndex < 0 || wordIndex >= this.currentTakeWords.length) {
      this.overlayHighlight.style.display = 'none';
      return;
    }
    
    try {
      // 🎯 현재 단어의 위치를 텍스트에서 찾기
      const wordPosition = this.findWordPositionInText(wordIndex);
      
      if (wordPosition) {
        // 🎨 박스 확장: 좌우 25%, 위 15%, 아래 10%
        const fontSizeExpansion = wordPosition.fontSize * 0.25; // 좌우 25%
        const topExpansion = wordPosition.fontSize * 0.15; // 위쪽 15%
        const bottomExpansion = wordPosition.fontSize * 0.1; // 아래쪽은 10%
        
        this.overlayHighlight.style.left = (wordPosition.left - fontSizeExpansion) + 'px';
        this.overlayHighlight.style.top = (wordPosition.top - topExpansion) + 'px';
        this.overlayHighlight.style.width = (wordPosition.width + fontSizeExpansion * 2) + 'px'; // 좌우 25%씩 확장
        this.overlayHighlight.style.height = (wordPosition.height + topExpansion + bottomExpansion) + 'px'; // 위 15% + 아래 10%
        this.overlayHighlight.style.display = 'block';
        
        this.log(`🎨 오버레이 하이라이트 업데이트: 단어 ${wordIndex + 1} "${this.currentTakeWords[wordIndex]?.text}" (폰트: ${wordPosition.fontSize}px, 좌우: ${fontSizeExpansion.toFixed(1)}px, 위: ${topExpansion.toFixed(1)}px, 아래: ${bottomExpansion.toFixed(1)}px)`);
      } else {
        this.overlayHighlight.style.display = 'none';
      }
      
    } catch (error) {
      this.warn('🎨 오버레이 하이라이트 업데이트 실패:', error);
      this.overlayHighlight.style.display = 'none';
    }
  }
  
  // 🔍 텍스트에서 단어 위치 찾기 (오버레이용)
  findWordPositionInText(wordIndex) {
    if (!this.currentOverlayTake || !this.currentTakeWords) {
      return null;
    }
    
    try {
      // 현재 테이크의 텍스트에서 해당 단어까지의 텍스트 추출
      const wordsUpToIndex = this.currentTakeWords.slice(0, wordIndex + 1);
      const textUpToWord = wordsUpToIndex.map(w => w.text).join(' ');
      const currentWord = this.currentTakeWords[wordIndex]?.text || '';
      
      // 테이크 엘리먼트에서 텍스트 찾기
      const takeElement = this.currentOverlayTake.element;
      
      if (!takeElement) {
        return null;
      }
      
      // Range API를 사용해서 단어 위치 찾기
      const range = this.findTextRangeInElement(takeElement, textUpToWord, currentWord);
      
      if (range) {
        const rect = range.getBoundingClientRect();
        
        // 폰트 크기 정보 가져오기
        const computedStyle = window.getComputedStyle(takeElement);
        const fontSize = parseFloat(computedStyle.fontSize) || 16; // 기본값 16px
        
        return {
          left: rect.left + window.scrollX,
          top: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
          fontSize: fontSize
        };
      }
      
    } catch (error) {
      this.warn('🔍 단어 위치 찾기 실패:', error);
    }
    
    return null;
  }
  
  // 🔍 엘리먼트에서 텍스트 범위 찾기
  findTextRangeInElement(element, textUpToWord, currentWord) {
    try {
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let textNode;
      let accumulatedText = '';
      
      while (textNode = walker.nextNode()) {
        const nodeText = textNode.textContent;
        const newAccumulatedText = accumulatedText + nodeText;
        
        // 현재 단어가 이 텍스트 노드에 있는지 확인
        const targetText = textUpToWord;
        const startIndex = newAccumulatedText.indexOf(targetText);
        
        if (startIndex !== -1) {
          // 텍스트 노드에서 단어의 정확한 위치 계산
          const nodeStartIndex = startIndex - accumulatedText.length;
          const wordStart = Math.max(0, nodeStartIndex + targetText.length - currentWord.length);
          const wordEnd = wordStart + currentWord.length;
          
          if (wordStart >= 0 && wordEnd <= nodeText.length) {
            const range = document.createRange();
            range.setStart(textNode, wordStart);
            range.setEnd(textNode, wordEnd);
            return range;
          }
        }
        
        accumulatedText = newAccumulatedText + ' ';
      }
      
    } catch (error) {
      this.warn('🔍 텍스트 범위 찾기 실패:', error);
    }
    
    return null;
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
    this.log('🛑 모든 재생 중지');
    
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
    
    this.log('✅ 정지 완료');
  }

  // 음성 선택
  selectVoice(index) {
    if (index >= 0 && index < this.VOICES.length) {
      this.selectedVoice = this.VOICES[index];
      this.updateUI();
      this.log(`음성 선택: ${this.selectedVoice.name}`);
      
      // 새로운 시스템에서는 마우스 위치 기반으로 재생하므로 호환성만 유지
      this.log(`음성 선택됨: ${this.selectedVoice.name} - 마우스를 올리고 다시 키를 누르세요`);
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
      this.error('HTML 뷰어 업데이트 실패:', error);
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
    // 🤖 Zeta AI / ChatGPT에서는 기존 플로팅 UI 숨김
    if (this.isZetaOrChatGPTMode()) {
      this.log('🤖 Zeta AI / ChatGPT: 기존 플로팅 UI 숨김');
      return;
    }
    
    // 테이크 리스트 표시 설정에 따라 표시/숨김
    if (this.floatingUI) {
      this.floatingUI.style.display = this.takeListVisible ? 'block' : 'none';
    }
    
    // 하단 플로팅 UI도 표시 설정에 따라 표시/숨김
    if (!this.bottomFloatingUI) {
      this.createBottomFloatingUI();
    }
    this.bottomFloatingUI.style.display = this.floatingBarVisible ? 'block' : 'none';
  }

  hideUI() {
    if (this.floatingUI) {
      this.floatingUI.style.display = 'none';
    }
    
    // 하단 플로팅 UI가 숨겨질 때 스크롤 영역도 제거
    const scrollSpacer = document.getElementById('tts-bottom-scroll-spacer');
    if (scrollSpacer) {
      scrollSpacer.remove();
      this.log('📏 하단 스크롤 영역 제거');
    }
    
    // 플러그인이 비활성화된 경우가 아니라면 하단 플로팅 UI는 계속 표시
    // (togglePlugin에서 직접 제어)
  }

  // 🎨 화면 주 배경색 기반 테마 자동 감지 및 적용
  async detectAndApplyTheme() {
    try {
      // 1단계: OS 다크모드 설정 확인
      const isOSDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.log(`🎨 OS 다크모드 설정: ${isOSDarkMode ? '다크' : '라이트'}`);
      
      // 2단계: 사이트가 OS 설정을 따르는지 확인
      const siteFollowsOS = this.checkIfSiteFollowsOS();
      this.log(`🎨 사이트 OS 설정 따름: ${siteFollowsOS}`);
      
      // 3단계: 사이트가 OS를 따르면 OS 설정 사용, 아니면 기존 로직 사용
      if (siteFollowsOS) {
        this.currentTheme = isOSDarkMode ? 'dark' : 'light';
        this.log(`🎨 OS 설정 사용: ${this.currentTheme}`);
      } else {
        const backgroundColor = await this.analyzePageBackgroundColor();
        const isDark = this.isColorDark(backgroundColor);
        
        this.currentTheme = isDark ? 'dark' : 'light';
        this.log(`🎨 배경색 기반 테마 감지: ${this.currentTheme} (배경색: ${backgroundColor})`);
      }
      
      // 테마 변경 시 하단 플로팅 UI 업데이트
      if (this.bottomFloatingUI) {
        this.updateBottomFloatingUITheme();
      }
      
      // 🤖 Zeta AI: 테마 변경 시 캐릭터 UI 재생성
      if (window.location.hostname.includes('zeta-ai')) {
        this.updateZetaAICharacterUITheme();
      }
      
      // OS 다크모드 설정 변경 감지 (실시간 업데이트)
      this.setupOSThemeChangeListener();
      
    } catch (error) {
      this.warn('🎨 테마 감지 실패, 기본 라이트 테마 사용:', error);
      this.currentTheme = 'light';
    }
  }

  // 🎨 OS 다크모드 설정 변경 감지 (실시간 업데이트)
  setupOSThemeChangeListener() {
    try {
      // 이미 리스너가 설정되어 있으면 중복 방지
      if (this.osThemeChangeListener) {
        return;
      }
      
      // OS 다크모드 설정 변경 감지
      this.osThemeChangeListener = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleThemeChange = (e) => {
        const isOSDarkMode = e.matches;
        this.log(`🎨 OS 다크모드 설정 변경 감지: ${isOSDarkMode ? '다크' : '라이트'}`);
        
        // 사이트가 OS 설정을 따르는 경우에만 테마 업데이트
        if (this.checkIfSiteFollowsOS()) {
          this.currentTheme = isOSDarkMode ? 'dark' : 'light';
          this.log(`🎨 OS 설정 변경으로 테마 업데이트: ${this.currentTheme}`);
          
          // UI 업데이트
          if (this.bottomFloatingUI) {
            this.updateBottomFloatingUITheme();
          }
          
          if (window.location.hostname.includes('zeta-ai')) {
            this.updateZetaAICharacterUITheme();
          }
        }
      };
      
      // 리스너 등록
      this.osThemeChangeListener.addEventListener('change', handleThemeChange);
      
      this.log('🎨 OS 다크모드 설정 변경 감지 리스너 등록 완료');
    } catch (error) {
      this.warn('🎨 OS 테마 변경 감지 설정 실패:', error);
    }
  }

  // 🔍 사이트가 OS 다크모드 설정을 따르는지 확인
  checkIfSiteFollowsOS() {
    try {
      const hostname = window.location.hostname;
      
      // OS 설정을 따르는 것으로 알려진 사이트들
      const osFollowingSites = [
        'perplexity.ai',
        'chat.openai.com',
        'bard.google.com',
        'claude.ai',
        'github.com',
        'stackoverflow.com',
        'reddit.com',
        'twitter.com',
        'x.com',
        'discord.com',
        'slack.com',
        'notion.so',
        'figma.com',
        'linear.app',
        'vercel.com',
        'netlify.com'
      ];
      
      // 사이트가 OS 설정을 따르는지 확인
      const followsOS = osFollowingSites.some(site => hostname.includes(site));
      
      if (followsOS) {
        this.log(`🎨 ${hostname}은 OS 다크모드 설정을 따릅니다.`);
      } else {
        this.log(`🎨 ${hostname}은 자체 테마 설정을 사용합니다.`);
      }
      
      return followsOS;
    } catch (error) {
      this.warn('🎨 OS 설정 확인 실패:', error);
      return false;
    }
  }

  // 🔍 페이지의 주 배경색 분석
  async analyzePageBackgroundColor() {
    // 방법 1: body의 computed style 확인
    const bodyBgColor = window.getComputedStyle(document.body).backgroundColor;
    
    // 방법 2: html 요소의 배경색 확인
    const htmlBgColor = window.getComputedStyle(document.documentElement).backgroundColor;
    
    // 방법 3: 가장 큰 영역을 차지하는 요소의 배경색 확인
    const dominantBgColor = this.findDominantBackgroundColor();
    
    // 우선순위: 명시적 body 색상 > 명시적 html 색상 > 주요 요소 색상 > 기본값
    let finalColor = 'rgb(255, 255, 255)'; // 기본 흰색
    
    if (bodyBgColor && bodyBgColor !== 'rgba(0, 0, 0, 0)' && bodyBgColor !== 'transparent') {
      finalColor = bodyBgColor;
    } else if (htmlBgColor && htmlBgColor !== 'rgba(0, 0, 0, 0)' && htmlBgColor !== 'transparent') {
      finalColor = htmlBgColor;
    } else if (dominantBgColor) {
      finalColor = dominantBgColor;
    }
    
    this.log(`🎨 배경색 분석: body(${bodyBgColor}), html(${htmlBgColor}), dominant(${dominantBgColor}) → ${finalColor}`);
    return finalColor;
  }

  // 🔍 화면에서 가장 넓은 영역을 차지하는 배경색 찾기
  findDominantBackgroundColor() {
    try {
      // 화면 중앙과 모서리 등 여러 지점에서 배경색 샘플링
      const samplePoints = [
        { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 }, // 중앙
        { x: window.innerWidth * 0.1, y: window.innerHeight * 0.1 }, // 좌상단
        { x: window.innerWidth * 0.9, y: window.innerHeight * 0.1 }, // 우상단
        { x: window.innerWidth * 0.1, y: window.innerHeight * 0.9 }, // 좌하단
        { x: window.innerWidth * 0.9, y: window.innerHeight * 0.9 }, // 우하단
        { x: window.innerWidth * 0.5, y: window.innerHeight * 0.1 }, // 상단 중앙
        { x: window.innerWidth * 0.5, y: window.innerHeight * 0.9 }, // 하단 중앙
      ];

      const colorCounts = {};

      for (const point of samplePoints) {
        const element = document.elementFromPoint(point.x, point.y);
        if (element) {
          const color = this.getEffectiveBackgroundColor(element);
          if (color && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') {
            colorCounts[color] = (colorCounts[color] || 0) + 1;
          }
        }
      }

      // 가장 많이 나타난 색상 반환
      const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
      return sortedColors.length > 0 ? sortedColors[0][0] : null;

    } catch (error) {
      this.warn('🔍 주요 배경색 찾기 실패:', error);
      return null;
    }
  }

  // 🎨 요소의 실제 배경색 찾기 (상위 요소까지 추적)
  getEffectiveBackgroundColor(element) {
    let currentElement = element;
    
    while (currentElement && currentElement !== document.body) {
      const style = window.getComputedStyle(currentElement);
      const bgColor = style.backgroundColor;
      
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        return bgColor;
      }
      
      currentElement = currentElement.parentElement;
    }
    
    // body까지 확인
    if (currentElement === document.body) {
      const bodyStyle = window.getComputedStyle(document.body);
      const bodyBgColor = bodyStyle.backgroundColor;
      if (bodyBgColor && bodyBgColor !== 'rgba(0, 0, 0, 0)' && bodyBgColor !== 'transparent') {
        return bodyBgColor;
      }
    }
    
    return 'rgb(255, 255, 255)'; // 기본 흰색
  }

  // 🔍 색상이 어두운지 판단
  isColorDark(colorString) {
    try {
      // RGB 값 추출
      const rgb = this.parseColorToRGB(colorString);
      if (!rgb) return false;

      // 상대 밝기 계산 (ITU-R BT.709 기준)
      const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
      
      // 0.5 미만이면 어두운 색상으로 판단
      const isDark = luminance < 0.5;
      this.log(`🔍 색상 분석: ${colorString} → RGB(${rgb.r}, ${rgb.g}, ${rgb.b}) → 밝기: ${luminance.toFixed(3)} → ${isDark ? '다크' : '라이트'}`);
      
      return isDark;
    } catch (error) {
      this.warn('🔍 색상 분석 실패:', error);
      return false; // 기본적으로 라이트 테마
    }
  }

  // 🎨 색상 문자열을 RGB 객체로 변환
  parseColorToRGB(colorString) {
    if (!colorString) return null;

    // rgb() 형식
    const rgbMatch = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3])
      };
    }

    // rgba() 형식
    const rgbaMatch = colorString.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
    if (rgbaMatch) {
      return {
        r: parseInt(rgbaMatch[1]),
        g: parseInt(rgbaMatch[2]),
        b: parseInt(rgbaMatch[3])
      };
    }

    // hex 형식 (#ffffff)
    const hexMatch = colorString.match(/^#([a-fA-F0-9]{6})$/);
    if (hexMatch) {
      const hex = hexMatch[1];
      return {
        r: parseInt(hex.substr(0, 2), 16),
        g: parseInt(hex.substr(2, 2), 16),
        b: parseInt(hex.substr(4, 2), 16)
      };
    }

    // 짧은 hex 형식 (#fff)
    const shortHexMatch = colorString.match(/^#([a-fA-F0-9]{3})$/);
    if (shortHexMatch) {
      const hex = shortHexMatch[1];
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16)
      };
    }

    return null;
  }

  // 🎯 하단 스크롤 영역 추가 (플로팅 UI 높이만큼)
  addBottomScrollSpacer() {
    // 기존 스크롤 영역 제거
    const existingSpacer = document.getElementById('tts-bottom-scroll-spacer');
    if (existingSpacer) {
      existingSpacer.remove();
    }

    // 새로운 스크롤 영역 생성
    const scrollSpacer = document.createElement('div');
    scrollSpacer.id = 'tts-bottom-scroll-spacer';
    scrollSpacer.style.cssText = `
      width: 100% !important;
      height: 45px !important;
      min-height: 45px !important;
      max-height: 45px !important;
      position: relative !important;
      display: block !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      background: transparent !important;
      pointer-events: none !important;
      user-select: none !important;
      z-index: 1 !important;
      box-sizing: border-box !important;
      flex-shrink: 0 !important;
      flex-grow: 0 !important;
      overflow: hidden !important;
    `;

    // body의 마지막 자식으로 추가 (플로팅 UI보다 앞에)
    document.body.appendChild(scrollSpacer);
    
    this.log('📏 하단 스크롤 영역 추가: 45px');
  }

    // 🎨 하단 플로팅 UI 테마 업데이트
  updateBottomFloatingUITheme() {
    if (!this.bottomFloatingUI) return;

    const isDark = this.currentTheme === 'dark';
    
    // 라이트 테마는 흰색, 다크 테마는 검정 + 블러 효과
    const bgColor = isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.6)' : '#1d1d1d';
    const borderColor = isDark ? 'rgba(125, 125, 125, 0.25)' : 'rgba(100, 100, 100, 0.4)';

    // 컨테이너 배경 업데이트 (블러 효과 포함)
    this.bottomFloatingUI.style.background = bgColor;
    this.bottomFloatingUI.style.backdropFilter = 'blur(10px)';
    this.bottomFloatingUI.style.webkitBackdropFilter = 'blur(10px)';
    this.bottomFloatingUI.style.color = textColor;

    // 버튼 스타일 업데이트 (투명 배경으로 부모 스타일 상속)
    if (this.bottomFloatingButton) {
      this.bottomFloatingButton.style.background = 'transparent';
      this.bottomFloatingButton.style.color = textColor;
      this.bottomFloatingButton.style.textAlign = 'center';
    }

    // 새로고침 버튼 스타일 업데이트
    if (this.refreshButton) {
      this.refreshButton.style.background = 'transparent';
      this.refreshButton.style.color = textColor;
    }
    
    // 테이크 수 라벨 스타일 업데이트
    if (this.bottomTakeCountLabel) {
      this.bottomTakeCountLabel.style.color = textColor;
    }

    // SVG 아이콘 색상 업데이트
    const svgStyle = this.bottomFloatingUI.querySelector('svg style');
    if (svgStyle) {
      svgStyle.textContent = `.company-logo { fill: ${textColor}; }`;
    }

    // TLDRL 텍스트 색상 업데이트
    const tldlrText = document.getElementById('tts-tldlr-text');
    if (tldlrText) {
      tldlrText.style.color = textColor;
      this.log(`🎨 TLDRL 텍스트 색상 업데이트: ${textColor}`);
    }

    // 보더 색상 업데이트 - 현재 위치에 맞는 보더만 적용
    if (this.bottomFloatingUI) {
      // 현재 위치를 확인하여 적절한 보더 설정
      const currentBottom = parseInt(this.bottomFloatingUI.style.bottom) || 0;
      const currentTransform = this.bottomFloatingUI.style.transform || '';
      
      if (currentTransform.includes('rotate(90deg)')) {
        // 좌측 모드: 상단 보더만
        this.updateFloatingBarBorder('left');
      } else if (currentTransform.includes('rotate(-90deg)')) {
        // 우측 모드: 상단 보더만
        this.updateFloatingBarBorder('right');
      } else if (currentBottom === 0) {
        // 하단 모드: 상단 보더만
        this.updateFloatingBarBorder('bottom');
      } else if (currentBottom >= window.innerHeight - 44) {
        // 상단 모드: 하단 보더만
        this.updateFloatingBarBorder('top');
      } else {
        // 중간 영역: 모든 보더 보임
        this.updateFloatingBarBorder('middle');
      }
      
      this.log(`🎨 구분선 색상 업데이트: ${borderColor}`);
    }

    // 상단 플로팅 UI 단축키 정보 구분선 색상 업데이트
    const shortcutInfo = document.getElementById('tts-floating-shortcut-info');
    if (shortcutInfo) {
      const shortcutBorderColor = isDark ? 'rgba(170, 170, 170, 0.4)' : 'rgba(29, 29, 29, 0.4)';
      const shortcutTextColor = isDark ? 'rgba(170, 170, 170, 0.6)' : 'rgba(29, 29, 29, 0.6)';
      
      shortcutInfo.style.borderTop = `1px solid ${shortcutBorderColor}`;
      shortcutInfo.style.color = shortcutTextColor;
      this.log(`🎨 상단 플로팅 UI 단축키 구분선 색상 업데이트: ${shortcutBorderColor}`);
    }

    // 상태 텍스트 재생성 (새 색상 적용)
    this.updateBottomFloatingUIState();

    this.log(`🎨 하단 플로팅 UI 테마 적용: ${this.currentTheme}`);
  }

  // 🎯 하단 플로팅 UI 생성 (audiobook-ui 스타일)
  createBottomFloatingUI() {
    // 기존 하단 플로팅 UI 제거
    if (this.bottomFloatingUI) {
      this.bottomFloatingUI.remove();
    }

    // 기존 스크롤 영역 추가 요소 제거
    const existingScrollSpacer = document.getElementById('tts-bottom-scroll-spacer');
    if (existingScrollSpacer) {
      existingScrollSpacer.remove();
    }

    // 테마별 배경색 설정
    const isDark = this.currentTheme === 'dark';
    const bgColor = isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.6)' : '#1d1d1d';
    const borderColor = isDark ? 'rgba(125, 125, 125, 0.25)' : 'rgba(100, 100, 100, 0.4)';

    this.bottomFloatingUI = document.createElement('div');
    this.bottomFloatingUI.id = 'tts-bottom-floating-ui';
    this.bottomFloatingUI.style.cssText = `
      position: fixed !important;
      left: 0 !important;
      bottom: 0 !important;
      width: 100% !important;
      z-index: 99999 !important;
      padding: 0 !important;
      margin: 0 !important;
      background: ${bgColor} !important;
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
      color: ${textColor} !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      display: none !important;
      border: none !important;
      cursor: grab !important;
      user-select: none !important;
      transition: all 0.3s ease !important;
    `;

    // 메인 버튼 컨테이너 (아이콘 + 텍스트 + 새로고침)
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      width: 100% !important;
      height: 44px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 0 16px !important;
      box-sizing: border-box !important;
      flex-wrap: nowrap !important;
      position: relative !important;
    `;

    // 좌측: SVG 아이콘 + TLDLR 텍스트
    const leftContainer = document.createElement('div');
    leftContainer.style.cssText = `
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      flex-shrink: 0 !important;
    `;
    
    const svgIcon = document.createElement('div');
    svgIcon.innerHTML = `
      <svg width="20" height="20" viewBox="281 404 33 33" xmlns="http://www.w3.org/2000/svg">
        <style>
          .company-logo { fill: ${textColor}; }
        </style>
        <path class="company-logo" d="M281.9,436.9h32.4v-32.4h-32.4v32.4ZM298,407.1c3.1,0,6,1.1,8.3,2.9l-7.8,7.8,2.5,2.5,7.8-7.8c1.8,2.3,2.9,5.2,2.9,8.3,0,7.5-6.1,13.7-13.7,13.7s-13.7-6.1-13.7-13.7,6.1-13.7,13.7-13.7Z"/>
      </svg>
    `;
    svgIcon.style.cssText = `
      pointer-events: auto !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    `;
    
    // TLDRL 텍스트
    const tldlrText = document.createElement('div');
    tldlrText.id = 'tts-tldlr-text';
    tldlrText.textContent = 'TLDRL';
    tldlrText.style.cssText = `
      color: ${textColor} !important;
      font-size: calc(${this.UI_FONT_SIZE} * 0.6) !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      white-space: nowrap !important;
      flex-shrink: 0 !important;
      z-index: 1 !important;
      text-align: left !important;
    `;
    
    leftContainer.appendChild(svgIcon);
    leftContainer.appendChild(tldlrText);

    // 로고 클릭 시 Supertone 웹사이트 새창으로 열기
    svgIcon.addEventListener('click', (event) => {
      event.stopPropagation(); // 버튼 클릭 이벤트와 분리
      window.open('https://supertone.ai/', '_blank');
    });

    // 중앙: 메인 버튼 (텍스트만) - 절대 위치로 중앙 고정
    this.bottomFloatingButton = document.createElement('button');
    this.bottomFloatingButton.style.cssText = `
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      transform: translate(-50%, -50%) !important;
      height: 44px !important;
      line-height: 39px !important;
      background: transparent !important;
      color: ${textColor} !important;
      border: 0 !important;
      box-shadow: none !important;
      font-size: ${this.UI_FONT_SIZE} !important;
      font-weight: normal !important;
      text-transform: none !important;
      cursor: pointer !important;
      transition: all 0.3s !important;
      font-family: inherit !important;
      outline: none !important;
      padding: 0 8px !important;
      margin: 0 !important;
      text-align: center !important;
      white-space: nowrap !important;
      z-index: 1 !important;
    `;

    // 우측: 테이크 수 표시 + 새로고침 버튼
    this.bottomTakeCountLabel = document.createElement('div');
    this.bottomTakeCountLabel.id = 'tts-bottom-take-count';
    this.bottomTakeCountLabel.style.cssText = `
      color: ${textColor} !important;
      font-size: calc(${this.UI_FONT_SIZE} * 0.6) !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      margin-right: 0px !important;
      white-space: nowrap !important;
      flex-shrink: 0 !important;
      z-index: 1 !important;
      text-align: right !important;
    `;
    this.bottomTakeCountLabel.textContent = '0개 문단';
    
    this.refreshButton = document.createElement('button');
    this.refreshButton.innerHTML = '<span class="refresh-icon">↺</span>';
    this.refreshButton.style.cssText = `
      width: 24px !important;
      height: 44px !important;
      min-width: 24px !important;
      max-width: 24px !important;
      background: transparent !important;
      color: ${textColor} !important;
      border: 0 !important;
      font-size: ${this.UI_FONT_SIZE} !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      cursor: pointer !important;
      transition: all 0.3s !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin-top: -1px !important;
      padding: 0 !important;
      outline: none !important;
      box-sizing: border-box !important;
      flex-shrink: 0 !important;
      z-index: 1 !important;
    `;

    // 새로고침 버튼 클릭 이벤트
    this.refreshButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.handleRefreshButtonClick();
    });

    // 컨테이너에 아이콘, 테이크 수, 새로고침 버튼 추가 (버튼은 절대 위치로 중앙에)
    buttonContainer.appendChild(leftContainer);
    
    // 우측 영역을 위한 컨테이너
    const rightContainer = document.createElement('div');
    rightContainer.style.cssText = `
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      flex-shrink: 0 !important;
    `;
    rightContainer.appendChild(this.bottomTakeCountLabel);
    rightContainer.appendChild(this.refreshButton);
    
    buttonContainer.appendChild(rightContainer);
    buttonContainer.appendChild(this.bottomFloatingButton);

    // 버튼 컨테이너를 직접 추가
    this.bottomFloatingUI.appendChild(buttonContainer);


    
    // 이벤트 리스너
    this.bottomFloatingButton.addEventListener('click', (event) => {
      this.handleBottomFloatingButtonClick(event);
    });

    // 드래그 기능 추가
    this.setupDraggableFloatingBar();

    document.body.appendChild(this.bottomFloatingUI);
    
    // 초기에는 숨김 상태로 시작 (showUI에서 설정에 따라 표시)
    this.bottomFloatingUI.style.display = 'none';
    
    // 초기 보더 설정: 하단 모드 (상단 보더만 보임)
    this.updateFloatingBarBorder('bottom');
    
    // 하단 스크롤 영역 추가
    this.addBottomScrollSpacer();
    
    // 테마 적용 후 상태 업데이트
    this.updateBottomFloatingUITheme();
    this.updateBottomFloatingUIState();
    
    this.log('🎯 하단 플로팅 UI 생성 완료');
  }

  // 🎯 드래그 가능한 플로팅바 설정
  setupDraggableFloatingBar() {
    if (!this.bottomFloatingUI) return;

    let isDragging = false;
    let startY = 0;
    let startX = 0;
    let startBottom = 0;
    let startLeft = 0;
    let originalPosition = 'bottom';
    let draggedPosition = null;

    // 드래그 시작
    const handleMouseDown = (e) => {
      // 버튼 클릭은 드래그로 처리하지 않음
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        return;
      }

      isDragging = true;
      startY = e.clientY;
      startX = e.clientX;
      startBottom = parseInt(this.bottomFloatingUI.style.bottom) || 0;
      startLeft = parseInt(this.bottomFloatingUI.style.left) || 0;
      
      this.bottomFloatingUI.style.cursor = 'grabbing';
      this.bottomFloatingUI.style.transition = 'none';
      
      // 드래그 중임을 표시
      this.bottomFloatingUI.style.opacity = '0.8';
      
      e.preventDefault();
    };

    // 드래그 중
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      // 좌우 스냅 영역 먼저 확인 (플로팅바 높이만큼)
      const sideSnapZone = 44; // 플로팅바 높이 44px
      const isLeftSnap = e.clientX <= sideSnapZone;
      const isRightSnap = e.clientX >= window.innerWidth - sideSnapZone;
      
      // 좌우 스냅 처리 (Y 좌표 계산 없이)
      if (isLeftSnap) {
        // 왼쪽 스냅: 90도 회전, 왼쪽 끝에 고정
        this.bottomFloatingUI.style.transformOrigin = '0 0'; // 좌상단 기준 회전
        this.bottomFloatingUI.style.transform = 'rotate(90deg)';
        this.bottomFloatingUI.style.left = '44px'; // 플로팅바 폭만큼
        this.bottomFloatingUI.style.bottom = 'auto';
        this.bottomFloatingUI.style.top = '0%';
        this.bottomFloatingUI.style.width = '100vh'; // 세로 100%로 변경
        this.bottomFloatingUI.style.padding = '0';
        this.bottomFloatingUI.style.borderRadius = '0';
        // 좌측 모드: 상단 보더만 보임
        this.updateFloatingBarBorder('left');
        return; // 좌우 스냅 시 포인터 반응 중단
      } else if (isRightSnap) {
        // 오른쪽 스냅: -90도 회전, 오른쪽 끝에 고정
        this.bottomFloatingUI.style.transformOrigin = '0 0'; // 좌상단 기준 회전
        this.bottomFloatingUI.style.transform = 'rotate(-90deg)';
        this.bottomFloatingUI.style.left = `${window.innerWidth - 44}px`;
        this.bottomFloatingUI.style.bottom = 'auto';
        this.bottomFloatingUI.style.top = '100%';
        this.bottomFloatingUI.style.width = '100vh'; // 세로 100%로 변경
        this.bottomFloatingUI.style.padding = '0';
        this.bottomFloatingUI.style.borderRadius = '0';
        // 우측 모드: 상단 보더만 보임
        this.updateFloatingBarBorder('right');
        return; // 좌우 스냅 시 포인터 반응 중단
      }
      
      // 중앙 영역에서만 Y 좌표 계산
      // 스냅 상태에서 이탈할 때는 현재 마우스 Y 위치를 기준으로 재계산
      let currentBottom = parseInt(this.bottomFloatingUI.style.bottom) || 0;
      if (this.bottomFloatingUI.style.transform !== 'rotate(0deg)') {
        // 스냅 상태에서 이탈하는 경우, 현재 마우스 Y 위치를 기준으로 bottom 계산
        const mouseY = e.clientY;
        const windowHeight = window.innerHeight;
        currentBottom = Math.max(0, windowHeight - mouseY - 22); // 플로팅바 높이의 절반만큼 조정
        startBottom = currentBottom; // 새로운 시작점으로 설정
      }
      
      const deltaY = startY - e.clientY;
      const newBottom = Math.max(0, startBottom + deltaY);
      
      // 최상단에서 플로팅바 높이만큼 아래로 제한 (화면을 벗어나지 않도록)
      const maxBottom = window.innerHeight - 44; // 플로팅바 높이 44px
      const clampedBottom = Math.max(0, Math.min(newBottom, maxBottom));
      
      // 스냅 기능: 하단/상단 영역에서는 고정
      const snapZone = 10; // 10px 스냅 영역
      let finalBottom = clampedBottom;
      
      // 하단 스냅 (0~10px 영역)
      if (clampedBottom <= snapZone) {
        finalBottom = 0; // 하단에 고정
        // 하단 모드: 상단 보더만 보임
        this.updateFloatingBarBorder('bottom');
      }
      // 상단 스냅 (maxBottom-10~maxBottom 영역)
      else if (clampedBottom >= maxBottom - snapZone) {
        finalBottom = maxBottom; // 상단에 고정
        // 상단 모드: 하단 보더만 보임
        this.updateFloatingBarBorder('top');
      }
      // 중간 영역에서는 포인터 따라오기
      else {
        finalBottom = clampedBottom;
        // 중간 영역: 모든 보더 보임
        this.updateFloatingBarBorder('middle');
      }
      
      // 중앙 영역: 회전 해제, 일반 모드로 완전 복원
      this.bottomFloatingUI.style.transformOrigin = 'center center'; // 기본 회전축으로 복원
      this.bottomFloatingUI.style.transform = 'rotate(0deg)';
      
      // 스냅 상태가 아닐 때: 폭 800px, 마우스 위치에 따라 이동
      if (finalBottom > 10 && finalBottom < maxBottom - 10) {
        // 스냅 영역 밖: 폭 800px, Y축처럼 상대적 이동
        const deltaX = e.clientX - startX;
        const deltaY = startY - e.clientY;
        const newLeft = startLeft + deltaX;
        const halfWidth = 700;
        
        // 화면 경계 제한
        let leftPosition = Math.max(0, Math.min(newLeft, window.innerWidth - halfWidth));
        
        this.bottomFloatingUI.style.left = `${leftPosition}px`;
        this.bottomFloatingUI.style.bottom = `${finalBottom}px`;
        this.bottomFloatingUI.style.top = 'auto';
        this.bottomFloatingUI.style.width = '700px';
        this.bottomFloatingUI.style.padding = '10px';
        this.bottomFloatingUI.style.borderRadius = '5px';
      } else {
        // 스냅 영역: 기본 모양으로 복귀
        this.bottomFloatingUI.style.left = '0px';
        this.bottomFloatingUI.style.bottom = `${finalBottom}px`;
        this.bottomFloatingUI.style.top = 'auto';
        this.bottomFloatingUI.style.width = '100%';
        this.bottomFloatingUI.style.padding = '0';
        this.bottomFloatingUI.style.borderRadius = '0';
      }
      
      // 위치에 따라 원본 위치 추적
      if (finalBottom < 10) {
        originalPosition = 'bottom';
      } else {
        originalPosition = 'dragged';
        draggedPosition = finalBottom;
      }
    };

    // 드래그 종료
    const handleMouseUp = () => {
      if (!isDragging) return;

      isDragging = false;
      this.bottomFloatingUI.style.cursor = 'grab';
      this.bottomFloatingUI.style.transition = 'all 0.3s ease';
      this.bottomFloatingUI.style.opacity = '1';
    };

    // 이벤트 리스너 추가
    this.bottomFloatingUI.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // 터치 이벤트도 지원
    this.bottomFloatingUI.addEventListener('touchstart', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        return;
      }
      isDragging = true;
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      startBottom = parseInt(this.bottomFloatingUI.style.bottom) || 0;
      startLeft = parseInt(this.bottomFloatingUI.style.left) || 0;
      
      this.bottomFloatingUI.style.cursor = 'grabbing';
      this.bottomFloatingUI.style.transition = 'none';
      this.bottomFloatingUI.style.opacity = '0.8';
      
      e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      // 좌우 스냅 영역 먼저 확인 (플로팅바 높이만큼)
      const sideSnapZone = 44; // 플로팅바 높이 44px
      const isLeftSnap = e.touches[0].clientX <= sideSnapZone;
      const isRightSnap = e.touches[0].clientX >= window.innerWidth - sideSnapZone;
      
      // 좌우 스냅 처리 (Y 좌표 계산 없이)
      if (isLeftSnap) {
        // 왼쪽 스냅: 90도 회전, 왼쪽 끝에 고정
        this.bottomFloatingUI.style.transformOrigin = '0 0'; // 좌상단 기준 회전
        this.bottomFloatingUI.style.transform = 'rotate(90deg)';
        this.bottomFloatingUI.style.left = '44px'; // 플로팅바 폭만큼
        this.bottomFloatingUI.style.bottom = 'auto';
        this.bottomFloatingUI.style.top = '0%';
        this.bottomFloatingUI.style.width = '100vh'; // 세로 100%로 변경
        this.bottomFloatingUI.style.padding = '0';
        this.bottomFloatingUI.style.borderRadius = '0';
        e.preventDefault();
        return; // 좌우 스냅 시 포인터 반응 중단
      } else if (isRightSnap) {
        // 오른쪽 스냅: -90도 회전, 오른쪽 끝에 고정
        this.bottomFloatingUI.style.transformOrigin = '0 0'; // 좌상단 기준 회전
        this.bottomFloatingUI.style.transform = 'rotate(-90deg)';
        this.bottomFloatingUI.style.left = `${window.innerWidth - 44}px`;
        this.bottomFloatingUI.style.bottom = 'auto';
        this.bottomFloatingUI.style.top = '100%';
        this.bottomFloatingUI.style.width = '100vh'; // 세로 100%로 변경
        this.bottomFloatingUI.style.padding = '0';
        this.bottomFloatingUI.style.borderRadius = '0';
        e.preventDefault();
        return; // 좌우 스냅 시 포인터 반응 중단
      }
      
      // 중앙 영역에서만 Y 좌표 계산
      // 스냅 상태에서 이탈할 때는 현재 터치 Y 위치를 기준으로 재계산
      let currentBottom = parseInt(this.bottomFloatingUI.style.bottom) || 0;
      if (this.bottomFloatingUI.style.transform !== 'rotate(0deg)') {
        // 스냅 상태에서 이탈하는 경우, 현재 터치 Y 위치를 기준으로 bottom 계산
        const touchY = e.touches[0].clientY;
        const windowHeight = window.innerHeight;
        currentBottom = Math.max(0, windowHeight - touchY - 22); // 플로팅바 높이의 절반만큼 조정
        startBottom = currentBottom; // 새로운 시작점으로 설정
      }
      
      const deltaY = startY - e.touches[0].clientY;
      const newBottom = Math.max(0, startBottom + deltaY);
      
      // 최상단에서 플로팅바 높이만큼 아래로 제한 (화면을 벗어나지 않도록)
      const maxBottom = window.innerHeight - 44; // 플로팅바 높이 44px
      const clampedBottom = Math.max(0, Math.min(newBottom, maxBottom));
      
      // 스냅 기능: 하단/상단 영역에서는 고정
      const snapZone = 10; // 10px 스냅 영역
      let finalBottom = clampedBottom;
      
      // 하단 스냅 (0~10px 영역)
      if (clampedBottom <= snapZone) {
        finalBottom = 0; // 하단에 고정
      }
      // 상단 스냅 (maxBottom-10~maxBottom 영역)
      else if (clampedBottom >= maxBottom - snapZone) {
        finalBottom = maxBottom; // 상단에 고정
      }
      // 중간 영역에서는 포인터 따라오기
      else {
        finalBottom = clampedBottom;
      }
      
      // 중앙 영역: 회전 해제, 일반 모드로 완전 복원
      this.bottomFloatingUI.style.transformOrigin = 'center center'; // 기본 회전축으로 복원
      this.bottomFloatingUI.style.transform = 'rotate(0deg)';
      
      // 스냅 상태가 아닐 때: 폭 800px, 터치 위치에 따라 이동
      if (finalBottom > 10 && finalBottom < maxBottom - 10) {
        // 스냅 영역 밖: 폭 800px, Y축처럼 상대적 이동
        const deltaX = e.touches[0].clientX - startX;
        const deltaY = startY - e.touches[0].clientY;
        const newLeft = startLeft + deltaX;
        const halfWidth = 700;
        
        // 화면 경계 제한
        let leftPosition = Math.max(0, Math.min(newLeft, window.innerWidth - halfWidth));
        
        this.bottomFloatingUI.style.left = `${leftPosition}px`;
        this.bottomFloatingUI.style.bottom = `${finalBottom}px`;
        this.bottomFloatingUI.style.top = 'auto';
        this.bottomFloatingUI.style.width = '700px';
        this.bottomFloatingUI.style.padding = '10px';
        this.bottomFloatingUI.style.borderRadius = '5px';
      } else {
        // 스냅 영역: 기본 모양으로 복귀
        this.bottomFloatingUI.style.left = '0px';
        this.bottomFloatingUI.style.bottom = `${finalBottom}px`;
        this.bottomFloatingUI.style.top = 'auto';
        this.bottomFloatingUI.style.width = '100%';
        this.bottomFloatingUI.style.padding = '0';
        this.bottomFloatingUI.style.borderRadius = '0';
      }
      
      if (finalBottom < 10) {
        originalPosition = 'bottom';
      } else {
        originalPosition = 'dragged';
        draggedPosition = finalBottom;
      }
      
      e.preventDefault();
    });

    document.addEventListener('touchend', handleMouseUp);

    // 더블클릭으로 원래 위치로 되돌리기
    this.bottomFloatingUI.addEventListener('dblclick', (e) => {
      // 버튼 클릭은 무시
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        return;
      }
      
      this.resetFloatingBarPosition();
    });
  }

  // 🎯 플로팅바 위치 초기화 (원래 위치로 되돌리기)
  resetFloatingBarPosition() {
    if (!this.bottomFloatingUI) return;

    this.bottomFloatingUI.style.bottom = '0px';
    this.bottomFloatingUI.style.left = '0px';
    this.bottomFloatingUI.style.width = '100%';
    this.bottomFloatingUI.style.transform = 'rotate(0deg)';
    this.bottomFloatingUI.style.top = 'auto'; // top 초기화
    this.bottomFloatingUI.style.padding = '0'; // 패딩 초기화
    this.bottomFloatingUI.style.borderRadius = '0'; // 라운드값 초기화
    this.bottomFloatingUI.style.transition = 'all 0.3s ease';
    
    // 하단 모드로 복귀 시 상단 보더만 보임
    this.updateFloatingBarBorder('bottom');
    
    this.log('🎯 플로팅바 위치 초기화 완료');
  }

  // 🎵 재생 속도를 텍스트로 변환
  getSpeedText(speed) {
    if (speed <= 0.6) return '정말 느리게';
    if (speed <= 0.8) return '조금 느리게';
    if (speed <= 1.0) return '보통 빠르기로';
    if (speed <= 1.2) return '조금 빠르게';
    if (speed <= 1.4) return '빠르게';
    if (speed <= 1.6) return '꽤 빠르게';
    return '정말 빠르게';
  }

  // 🎵 속도 메뉴 표시
  // 🎵 속도 메뉴 표시 (app.js PopupCard 스타일)
  showSpeedMenu() {
    // 기존 속도 메뉴가 있다면 제거
    this.hideSpeedMenu();
    
    // 테마 색상 가져오기 (하단 플로팅과 동일한 스타일)
    const isDark = this.currentTheme === 'dark';
    const bgColor = isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.6)' : '#1d1d1d';
    const borderColor = isDark ? 'rgba(255, 255, 255, 1.0)' : 'rgba(29, 29, 29, 0.3)';
    
    // 팝업 카드 컨테이너 생성 (app.js PopupCard 스타일)
    this.speedMenuPopup = document.createElement('div');
    this.speedMenuPopup.id = 'tts-speed-menu-popup';
    this.speedMenuPopup.style.cssText = `
      position: fixed !important;
      bottom: 0 !important;
      left: 50% !important;
      transform: translate(-50%, 0) !important;
      width: 60% !important;
      min-height: 40vh !important;
      max-height: 60vh !important;
      background: ${bgColor} !important;
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
      border: 1px solid rgba(125, 125, 125, 0.2) !important;
      border-radius: 3px !important;
      box-shadow: 0px 0px 60px ${textColor}50 !important;
      z-index: 100002 !important;
      line-height: 1.5rem !important;
      padding: 0 !important;
      overflow-y: auto !important;
      -ms-overflow-style: none !important;
      scrollbar-width: none !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      animation: slideIn 0.7s ease forwards !important;
    `;
    
    // 스크롤바 숨기기
    this.speedMenuPopup.style.setProperty('-webkit-scrollbar', 'none', 'important');
    
    // 제목 추가 (app.js Typography 스타일)
    const title = document.createElement('div');
    title.style.cssText = `
      margin-bottom: 24px !important;
      font-weight: 400 !important;
      -webkit-text-stroke: 0.03em !important;
      paint-order: stroke fill !important;
      color: ${textColor} !important;
      padding: 24px 24px 0 24px !important;
      text-align: left !important;
      text-transform: none !important;
              font-size: ${this.UI_FONT_SIZE} !important;
    `;
    title.textContent = '읽는 속도';
    this.speedMenuPopup.appendChild(title);

    // 각 속도 옵션 생성 (app.js 스타일)
    this.SPEED_OPTIONS.forEach((speedOption) => {
      const speedItem = document.createElement('div');
      speedItem.style.cssText = `
        padding: 5px 24px 10px 24px !important;
        cursor: pointer !important;
        border-radius: 8px !important;
        -webkit-tap-highlight-color: rgba(139, 69, 19, 0.1) !important;
        transition: background-color 0.2s !important;
      `;
      
      // Typography 컨테이너 (app.js 스타일)
      const typography = document.createElement('div');
      typography.style.cssText = `
        text-align: left !important;
        text-transform: none !important;
      `;
      
      // 속도 텍스트 (언더라인 있음, 하단 플로팅과 동일한 스타일)
      const speedText = document.createElement('span');
      speedText.style.cssText = `
        color: ${textColor} !important;
        text-decoration: underline !important;
        text-underline-offset: 5px !important;
        text-decoration-color: ${this.currentTheme === 'dark' ? 'rgba(170, 170, 170, 0.4)' : 'rgba(29, 29, 29, 0.4)'} !important;
        cursor: inherit !important;
        display: inline !important;
        font-size: ${this.UI_FONT_SIZE} !important;
      `;
      speedText.textContent = speedOption.text;
      
      typography.appendChild(speedText);
      speedItem.appendChild(typography);
      
      // 클릭 이벤트 (app.js 스타일)
      speedItem.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.selectSpeed(speedOption);
        this.hideSpeedMenu();
      });

      // 호버 효과 (app.js 스타일)
      speedItem.addEventListener('mouseenter', () => {
        speedItem.style.backgroundColor = 'rgba(139, 69, 19, 0.1) !important';
      });

      speedItem.addEventListener('mouseleave', () => {
        speedItem.style.backgroundColor = 'transparent !important';
      });

      this.speedMenuPopup.appendChild(speedItem);
    });
    
    // 하단 여백 추가 (app.js 스타일)
    const bottomSpacer = document.createElement('div');
    bottomSpacer.style.cssText = 'height: 30px !important;';
    this.speedMenuPopup.appendChild(bottomSpacer);

    // 백드롭 생성 (외곽 클릭 감지용)
    this.speedMenuBackdrop = document.createElement('div');
    this.speedMenuBackdrop.id = 'tts-speed-menu-backdrop';
    this.speedMenuBackdrop.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: transparent !important;
      z-index: 99999 !important;
    `;
    
    // 백드롭 클릭 시 메뉴 닫기
    this.speedMenuBackdrop.addEventListener('click', () => {
      this.hideSpeedMenu();
    });
    
    // 문서에 추가 (백드롭 먼저, 그 다음 메뉴)
    document.body.appendChild(this.speedMenuBackdrop);
    document.body.appendChild(this.speedMenuPopup);

    // 외부 클릭 시 메뉴 닫기
    setTimeout(() => {
      document.addEventListener('click', this.handleSpeedMenuOutsideClick.bind(this));
    }, 100);
  }

  // 🎵 속도 메뉴 숨기기
  hideSpeedMenu() {
    if (this.speedMenuPopup) {
      // 슬라이드 아웃 애니메이션 (app.js 스타일)
      this.speedMenuPopup.style.animation = 'slideOut 0.2s ease forwards !important';
      setTimeout(() => {
        if (this.speedMenuPopup && this.speedMenuPopup.parentNode) {
          this.speedMenuPopup.parentNode.removeChild(this.speedMenuPopup);
        }
        this.speedMenuPopup = null;
        if (this.speedMenuBackdrop) {
          this.speedMenuBackdrop.remove();
          this.speedMenuBackdrop = null;
        }
      }, 200);
    }
    
    document.removeEventListener('click', this.handleSpeedMenuOutsideClick.bind(this));
  }

  // 🎵 속도 메뉴 외부 클릭 처리
  handleSpeedMenuOutsideClick(event) {
    if (this.speedMenuPopup && !this.speedMenuPopup.contains(event.target)) {
      this.hideSpeedMenu();
    }
  }

  // 🎵 속도 선택 및 테이크 재생성
  async selectSpeed(speedOption) {
    const previousSpeed = this.playbackSpeed;
    this.playbackSpeed = speedOption.speed;
    
    // 속도 설정 저장
    await this.saveSpeedSetting(speedOption.speed);
    
    this.log(`🎵 속도 선택: ${speedOption.speed}x (${speedOption.text})`);
    
    // 메뉴 숨기기
    this.hideSpeedMenu();
    
    // UI 업데이트
    this.updateBottomFloatingUIState();
    
    // 속도가 실제로 변경된 경우에만 재생성
    if (previousSpeed !== this.playbackSpeed) {
      this.handleVoiceOrSpeedChange();
    }
  }

  // 🎯 플로팅바 보더 업데이트 (상하좌우 모드별)
  updateFloatingBarBorder(mode) {
    if (!this.bottomFloatingUI) return;
    
    const isDark = this.currentTheme === 'dark';
    const borderColor = isDark ? 'rgba(125, 125, 125, 0.25)' : 'rgba(100, 100, 100, 0.4)';
    
    // 모든 보더 초기화
    this.bottomFloatingUI.style.borderTop = 'none';
    this.bottomFloatingUI.style.borderBottom = 'none';
    this.bottomFloatingUI.style.borderLeft = 'none';
    this.bottomFloatingUI.style.borderRight = 'none';
    
    // 모드별 보더 설정
    switch (mode) {
      case 'top':
        // 상단 모드: 하단 보더만 보임
        this.bottomFloatingUI.style.borderBottom = `1px solid ${borderColor}`;
        break;
      case 'bottom':
        // 하단 모드: 상단 보더만 보임
        this.bottomFloatingUI.style.borderTop = `1px solid ${borderColor}`;
        break;
      case 'left':
        // 좌측 모드: 상단 보더만 보임
        this.bottomFloatingUI.style.borderTop = `1px solid ${borderColor}`;
        break;
      case 'right':
        // 우측 모드: 상단 보더만 보임
        this.bottomFloatingUI.style.borderTop = `1px solid ${borderColor}`;
        break;
      case 'middle':
        // 중간 영역: 모든 보더 보임
        this.bottomFloatingUI.style.border = `1px solid ${borderColor}`;
        break;
      default:
        // 기본값: 하단 모드 (상단 보더만)
        this.bottomFloatingUI.style.borderTop = `1px solid ${borderColor}`;
        break;
    }
    
    this.log(`🎨 플로팅바 보더 업데이트: ${mode} 모드`);
  }

  // 🎯 하단 플로팅 UI 상태 업데이트
  updateBottomFloatingUIState() {
    if (!this.bottomFloatingButton) return;

    // 테마별 색상 설정 (audiobook-ui 원래 색상)
    const textColor = this.currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#1d1d1d';
    const underlineColor = this.currentTheme === 'dark' ? 'rgba(170, 170, 170, 0.4)' : 'rgba(29, 29, 29, 0.4)';

    if (this.isPlaying && !this.isPaused) {
      // 재생 중
      const speedText = this.getSpeedText(this.playbackSpeed);
      
      this.bottomFloatingButton.innerHTML = `
        <span style="cursor: pointer; color: ${textColor};">
          <span style="
            text-decoration: underline;
            text-underline-position: under;
            display: inline;
            text-decoration-color: ${underlineColor};
            text-underline-offset: 5%;
            cursor: pointer;
            color: ${textColor};
          " data-action="voice-menu">
            ${this.selectedVoice.name}
          </span>
          님이
          <span style="
            color: ${textColor};
            margin: 0 2px;
            cursor: pointer;
            text-decoration: underline;
            text-underline-position: under;
            text-decoration-color: ${underlineColor};
            text-underline-offset: 5%;
          " data-action="speed-menu">
            ${speedText}
          </span>
          <span style="
            text-decoration: underline;
            text-underline-position: under;
            display: inline;
            text-decoration-color: ${underlineColor};
            text-underline-offset: 5%;
            color: ${textColor};
          ">
            읽고 있어요
          </span>
        </span>
      `;
    } else if (this.isPaused) {
      // 일시정지 중
      this.bottomFloatingButton.innerHTML = `
        <span style="cursor: pointer; color: ${textColor};">
          <span style="
            text-decoration: underline;
            text-underline-position: under;
            display: inline;
            text-decoration-color: ${underlineColor};
            text-underline-offset: 5%;
            cursor: pointer;
            color: ${textColor};
          " data-action="voice-menu">
            ${this.selectedVoice.name}
          </span>
          님이
          <span style="
            text-decoration: underline;
            text-underline-position: under;
            display: inline;
            margin-left: 2px;
            text-decoration-color: ${underlineColor};
            text-underline-offset: 5%;
            color: ${textColor};
          ">
            쉬고 있어요
          </span>
        </span>
      `;
    } else {
      // 정지 상태
      const speedText = this.getSpeedText(this.playbackSpeed);
      this.bottomFloatingButton.innerHTML = `
        <span style="color: ${textColor};">
          <span style="
            text-decoration: underline;
            text-underline-position: under;
            display: inline;
            text-decoration-color: ${underlineColor};
            text-underline-offset: 5%;
            cursor: pointer;
            color: ${textColor};
          " data-action="voice-menu">
            ${this.selectedVoice.name}
          </span>
          님의 목소리로
          <span style="
            color: ${textColor};
            margin: 0 2px;
            cursor: pointer;
            text-decoration: underline;
            text-underline-position: under;
            text-decoration-color: ${underlineColor};
            text-underline-offset: 5%;
          " data-action="speed-menu">
            ${speedText}
          </span>
          <span style="
            text-decoration: underline;
            text-underline-position: under;
            display: inline;
            margin-left: 2px;
            text-decoration-color: ${underlineColor};
            text-underline-offset: 5%;
            cursor: pointer;
            color: ${textColor};
          " data-action="start-reading">
            읽어 보세요
          </span>
        </span>
      `;
    }
  }

  // 🎯 하단 플로팅 버튼 클릭 처리
  async handleBottomFloatingButtonClick(event) {
    // 화자 메뉴 클릭 처리
    if (event && event.target.dataset.action === 'voice-menu') {
      event.stopPropagation();
      this.showVoiceMenu();
      return;
    }

    // '읽어 보세요' 클릭 처리
    if (event && event.target.dataset.action === 'start-reading') {
      event.stopPropagation();
      await this.startReadingFromFirst();
      return;
    }

    // 속도 메뉴 클릭 처리
    if (event && event.target.dataset.action === 'speed-menu') {
      event.stopPropagation();
      this.showSpeedMenu();
      return;
    }

    // 재생/일시정지 처리 (버튼의 다른 영역 클릭)
    if (this.isPlaying) {
      if (this.isPaused) {
        this.resumePlayback();
      } else {
        this.pausePlayback();
      }
    } else {
      // 정지 상태에서 버튼 클릭 시 리프레시 요청
      await this.requestRefresh();
    }
  }

  // 🤖 Zeta AI / ChatGPT 새로운 글 업데이트 모니터링
  startZetaAIMonitoring() {
    // 플러그인이 비활성화된 경우 모니터링 중지
    if (!this.isPluginEnabled) {
      return;
    }
    
    if (!this.isZetaOrChatGPTMode()) {
      return; // Zeta AI / ChatGPT 사이트가 아니면 모니터링 중지
    }
    
    // 이미 모니터링 중이면 중복 시작 방지
    if (this.zetaAIMonitorInterval) {
      this.log('🤖 Zeta AI: 이미 모니터링 중입니다.');
      return;
    }
    
    this.log('🤖 Zeta AI / ChatGPT 모니터링 시작 (1번 테이크 모니터링)');
    
    // 초기 1번 테이크 저장
    this.previousFirstTake = this.preTakes && this.preTakes.length > 0 ? this.preTakes[0].text : '';
    
    // 모니터링 인터벌 설정 (1초마다)
    this.zetaAIMonitorInterval = setInterval(async () => {
      try {
        // 현재 페이지 분석 (기존 테이크 유지하면서)
        const previousTakesLength = this.preTakes ? this.preTakes.length : 0;
        await this.analyzePageAndCreateTakes();
        
        // 1번 테이크 확인
        const currentFirstTake = this.preTakes && this.preTakes.length > 0 ? this.preTakes[0].text : '';
        
        // 디버깅 로그 추가
        this.log(`🤖 Zeta AI 모니터링: 현재 테이크 "${currentFirstTake?.substring(0, 30)}...", 이전 테이크 "${this.previousFirstTake?.substring(0, 30)}..."`);
        
        // 1번 테이크가 바뀐 경우 (빈 문자열이 아니고, 이전과 다른 경우)
        if (currentFirstTake && 
            currentFirstTake.trim() !== '' && 
            currentFirstTake !== this.previousFirstTake) {
          
          this.log('🤖 Zeta AI: 1번 테이크 변경 감지!');
          
          // 🤖 Zeta AI: 화자 구분 로직 적용
          this.determineZetaAISpeaker();
          
          // 바뀐 1번 테이크를 팝업으로 표시
          this.showZetaAINewContentOverlay(currentFirstTake);
          
          // 🤖 Zeta AI: 바뀐 테이크를 발화 큐에 추가 (순차 발화)
          const firstTake = this.preTakes[0];
          this.addToZetaAISpeechQueue(currentFirstTake, firstTake.language);
          
          // 현재 1번 테이크를 이전 값으로 저장
          this.previousFirstTake = currentFirstTake;
          
          this.log('🤖 Zeta AI: 테이크 변경 처리 완료');
        }
              } catch (error) {
          this.error('🤖 Zeta AI / ChatGPT 모니터링 오류:', error);
          // 에러가 발생해도 모니터링은 계속 유지
          this.log('🤖 Zeta AI: 모니터링 계속 유지 중...');
        }
    }, 1000); // 1초마다로 변경
  }
  
  // 🤖 Zeta AI 모니터링 중지
  stopZetaAIMonitoring() {
    if (this.zetaAIMonitorInterval) {
      clearInterval(this.zetaAIMonitorInterval);
      this.zetaAIMonitorInterval = null;
      this.previousFirstTake = ''; // 이전 1번 테이크 초기화
      
          // 🤖 Zeta AI: 화자 관련 상태 초기화
    this.zetaAIEnterFlag = false;
    this.zetaAICurrentSpeaker = 'speaker2'; // 기본값을 화자2로 설정
      
      // 🤖 Zeta AI: 엔터키 감지 시스템 정리
      this.cleanupZetaAIEnterKeyDetection();
      
      // 🤖 Zeta AI: 캐릭터 UI 정리
      this.cleanupZetaAICharacterUI();
      
      // 🤖 Zeta AI: 발화 큐 정리
      this.cleanupZetaAISpeechQueue();
      
      // OS 테마 리스너 정리
      this.cleanupOSThemeListener();
      
      this.log('🤖 Zeta AI / ChatGPT 모니터링 중지 (화자 상태 초기화)');
    }
  }

  // 🤖 Zeta AI: 엔터키 감지 시스템 정리
  cleanupZetaAIEnterKeyDetection() {
    // MutationObserver 정리
    if (this.zetaAIMutationObserver) {
      this.zetaAIMutationObserver.disconnect();
      this.zetaAIMutationObserver = null;
    }
    
    // 주기적 스캔 인터벌 정리
    if (this.zetaAIInputScanInterval) {
      clearInterval(this.zetaAIInputScanInterval);
      this.zetaAIInputScanInterval = null;
    }
    
    this.log('🤖 Zeta AI / ChatGPT: 엔터키 감지 시스템 정리 완료');
  }

  // 🤖 Zeta AI: 캐릭터 UI 정리
  cleanupZetaAICharacterUI() {
    // 좌하단 캐릭터 UI 제거
    if (this.zetaAILeftCharacterUI) {
      this.zetaAILeftCharacterUI.remove();
      this.zetaAILeftCharacterUI = null;
    }
    
    // 우하단 캐릭터 UI 제거
    if (this.zetaAIRightCharacterUI) {
      this.zetaAIRightCharacterUI.remove();
      this.zetaAIRightCharacterUI = null;
    }
    
    this.log('🤖 Zeta AI: 캐릭터 UI 정리 완료');
  }

  // 🤖 Zeta AI / ChatGPT: 발화 큐 정리
  cleanupZetaAISpeechQueue() {
    // 현재 재생 중인 오디오 중지
    if (this.zetaAICurrentAudio) {
      this.zetaAICurrentAudio.pause();
      this.zetaAICurrentAudio = null;
    }
    
    // 큐 비우기
    this.zetaAISpeechQueue = [];
    this.zetaAIIsPlaying = false;
    
    this.log('🤖 Zeta AI / ChatGPT: 발화 큐 정리 완료');
  }

  // 🎨 OS 테마 리스너 정리
  cleanupOSThemeListener() {
    if (this.osThemeChangeListener) {
      this.osThemeChangeListener.removeEventListener('change', this.handleThemeChange);
      this.osThemeChangeListener = null;
      this.log('🎨 OS 테마 리스너 정리 완료');
    }
  }

  // 🤖 Zeta AI / ChatGPT: 모든 발화 강제 중단 (화자1 우선 발화용)
  forceStopAllZetaAISpeech() {
    this.log('🤖 Zeta AI / ChatGPT: 모든 발화 강제 중단 시작');
    
    // 현재 재생 중인 오디오 즉시 중지
    if (this.zetaAICurrentAudio) {
      this.zetaAICurrentAudio.pause();
      this.zetaAICurrentAudio.currentTime = 0;
      this.zetaAICurrentAudio = null;
    }
    
    // 기존 TTS 재생도 중지
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    
    // 재생 상태 초기화
    this.isPlaying = false;
    this.isPaused = false;
    
    // 발화 큐는 유지 (화자1만 남기기 위해)
    this.zetaAIIsPlaying = false;
    
    this.log('🤖 Zeta AI / ChatGPT: 모든 발화 강제 중단 완료');
  }

  // 🤖 Zeta AI / ChatGPT: 3초 지연 후 테이크 감지 시작
  startZetaAIDelayedTakeDetection() {
    if (!this.isZetaOrChatGPTMode()) {
      return;
    }
    
    this.log('🤖 Zeta AI: 3초 후 테이크 감지 시작 예정');
    
    setTimeout(() => {
      this.log('🤖 Zeta AI: 테이크 감지 시작');
      this.startZetaAIMonitoring();
    }, 3000); // 3초 지연
  }

  // 🤖 Zeta AI: 기존 하단 플로팅 UI 숨김
  hideBottomFloatingUIForZetaAI() {
    if (!window.location.hostname.includes('zeta-ai')) {
      return;
    }
    
    // 하단 플로팅 UI 숨김
    if (this.bottomFloatingUI) {
      this.bottomFloatingUI.style.display = 'none !important';
    }
    
    // 하단 스크롤 영역 제거
    const scrollSpacer = document.getElementById('tts-bottom-scroll-spacer');
    if (scrollSpacer) {
      scrollSpacer.remove();
    }
    
    this.log('🤖 Zeta AI: 기존 하단 플로팅 UI 숨김 완료');
  }

  // 🤖 Zeta AI: 모든 기존 플로팅 UI 숨김
  hideAllFloatingUIForZetaAI() {
    if (!window.location.hostname.includes('zeta-ai')) {
      return;
    }
    
    // 상단 플로팅 UI 숨김
    if (this.floatingUI) {
      this.floatingUI.style.display = 'none !important';
    }
    
    // 테이크 호버 아이콘 숨김
    this.hideTakeHoverIcon();
    
    // 모든 TTS 관련 오버레이 제거
    this.removeAllHighlights();
    
    this.log('🤖 Zeta AI: 모든 기존 플로팅 UI 숨김 완료');
  }

  // 🤖 Zeta AI / ChatGPT: 발화 큐에 추가
  addToZetaAISpeechQueue(text, language) {
    // 플러그인이 비활성화된 경우 발화 큐 추가 중지
    if (!this.isPluginEnabled) {
      return;
    }
    
    if (!this.isZetaOrChatGPTMode()) {
      return;
    }
    
    // 현재 화자 정보 가져오기
    const currentVoice = this.zetaAICurrentSpeaker === 'speaker1' ? 
      this.zetaAISpeaker1Voice : this.zetaAISpeaker2Voice;
    
    // 큐에 추가
    this.zetaAISpeechQueue.push({
      text: text,
      language: language,
      voice: currentVoice,
      speaker: this.zetaAICurrentSpeaker
    });
    
    this.log(`🤖 Zeta AI / ChatGPT: 발화 큐에 추가 (${this.zetaAISpeechQueue.length}개 대기)`);
    this.log(`🤖 Zeta AI: 추가된 텍스트: "${text.substring(0, 30)}..." (${currentVoice.name})`);
    
    // 큐 처리 시작 (이미 재생 중이 아니면)
    if (!this.zetaAIIsPlaying) {
      this.processZetaAISpeechQueue();
    } else {
      this.log(`🤖 Zeta AI: 이미 재생 중이므로 큐에만 추가 (${this.zetaAISpeechQueue.length}개 대기)`);
    }
  }

  // 🤖 Zeta AI / ChatGPT: 발화 큐 처리
  async processZetaAISpeechQueue() {
    if (!this.isZetaOrChatGPTMode()) {
      return;
    }
    
    if (this.zetaAISpeechQueue.length === 0) {
      this.zetaAIIsPlaying = false;
      this.log('🤖 Zeta AI: 발화 큐 비움');
      return;
    }
    
    this.zetaAIIsPlaying = true;
    const speechItem = this.zetaAISpeechQueue.shift();
    
          this.log(`🤖 Zeta AI / ChatGPT: 발화 시작 (${this.zetaAISpeechQueue.length}개 남음)`);
    this.log(`🤖 Zeta AI: 발화 텍스트: "${speechItem.text.substring(0, 30)}..." (${speechItem.voice.name})`);
    
    try {
      await this.playZetaAISpeechItem(speechItem);
    } catch (error) {
      this.error('🤖 Zeta AI: 발화 실패:', error);
    } finally {
      // 다음 큐 아이템 처리
      setTimeout(() => {
        // 큐가 비어있으면 재생 상태를 false로 설정
        if (this.zetaAISpeechQueue.length === 0) {
          this.zetaAIIsPlaying = false;
          this.log('🤖 Zeta AI: 발화 큐 완료, 재생 상태 false로 설정');
        } else {
          this.processZetaAISpeechQueue();
        }
      }, 100); // 100ms 지연 후 다음 처리
    }
  }

  // 🤖 Zeta AI / ChatGPT: 개별 발화 아이템 재생
  async playZetaAISpeechItem(speechItem) {
    return new Promise(async (resolve, reject) => {
      try {
        // 🤖 Zeta AI / ChatGPT: 기존 오디오 중지 (안전하게)
        if (this.zetaAICurrentAudio) {
          this.zetaAICurrentAudio.pause();
          this.zetaAICurrentAudio = null;
        }
        
        // 🤖 Zeta AI / ChatGPT: 화자별 음성으로 임시 설정 변경
        const originalVoice = this.selectedVoice;
        const originalSpeed = this.playbackSpeed;
        this.selectedVoice = speechItem.voice;
        this.playbackSpeed = 1.0; // Zeta AI / ChatGPT에서는 모든 캐릭터 속도 1.0 고정
        
        // 음성 생성
        const zetaTake = {
          id: 'zeta-ai-take',
          text: speechItem.text,
          language: speechItem.language,
          element: null
        };
        
        const audioUrl = await this.convertToSpeech(zetaTake);
        
        // 🤖 Zeta AI / ChatGPT: 원래 음성과 속도로 복원
        this.selectedVoice = originalVoice;
        this.playbackSpeed = originalSpeed;
        
        if (!audioUrl) {
          throw new Error('음성 생성 실패');
        }
        
        // 오디오 재생
        this.zetaAICurrentAudio = new Audio(audioUrl);
        this.zetaAICurrentAudio.volume = 1.0;
        
        // 재생 완료 시 정리
        this.zetaAICurrentAudio.addEventListener('ended', () => {
          this.log('🤖 Zeta AI / ChatGPT: 발화 완료');
          this.zetaAICurrentAudio = null;
          resolve();
        });
        
        // 오류 처리
        this.zetaAICurrentAudio.addEventListener('error', (error) => {
          this.error('🤖 Zeta AI / ChatGPT: 발화 오류:', error);
          this.zetaAICurrentAudio = null;
          reject(error);
        });
        
        // 재생 시작
        await this.zetaAICurrentAudio.play();
        this.log('🤖 Zeta AI / ChatGPT: 발화 재생 중...');
        
      } catch (error) {
        this.error('🤖 Zeta AI / ChatGPT: 발화 아이템 재생 실패:', error);
        reject(error);
      }
    });
  }

  // 🤖 Zeta AI / ChatGPT: 캐릭터 선택 UI 생성
  createZetaAICharacterSelectionUI() {
    if (!this.isZetaOrChatGPTMode()) {
      return; // Zeta AI / ChatGPT 사이트가 아니면 생성하지 않음
    }
    
    this.log('🤖 Zeta AI / ChatGPT: 캐릭터 선택 UI 생성 시작');
    
    // 테마별 배경색 설정 (다른 플로팅 UI와 동일)
    const isDark = this.currentTheme === 'dark';
    const bgColor = isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.6)' : '#1d1d1d';
    const borderColor = isDark ? 'rgba(125, 125, 125, 0.25)' : 'rgba(125, 125, 125, 0.5)';
    
    // 좌하단 캐릭터 선택 UI (화자2용)
    this.createZetaAICharacterUI('left', bgColor, textColor, borderColor);
    
    // 우하단 캐릭터 선택 UI (화자1용)
    this.createZetaAICharacterUI('right', bgColor, textColor, borderColor);
    
    this.log('🤖 Zeta AI / ChatGPT: 캐릭터 선택 UI 생성 완료');
  }

  // 🤖 Zeta AI: 개별 캐릭터 선택 UI 생성
  createZetaAICharacterUI(position, bgColor, textColor, borderColor) {
    const container = document.createElement('div');
    container.id = `zeta-ai-character-${position}`;
    container.style.cssText = `
      position: fixed !important;
      bottom: 60px !important;
      ${position}: 20px !important;
      background: ${bgColor} !important;
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
      border: 1px solid ${borderColor} !important;
      border-radius: 8px !important;
      padding: 12px !important;
      max-width: 200px !important;
      max-height: 400px !important;
      overflow-y: auto !important;
      z-index: 99999 !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      font-size: 12px !important;
      color: ${textColor} !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2) !important;
    `;
    
    // 제목 제거 (화자1 설명, 화자2 설명 맨 윗줄 필요 없으니까 지워줘)
    
          // 캐릭터 목록 생성
      this.VOICES.forEach((voice, index) => {
        const characterItem = document.createElement('div');
        characterItem.style.cssText = `
          padding: 0px 8px !important;
          margin: 0px !important;
          border-radius: 4px !important;
          cursor: pointer !important;
          transition: background-color 0.2s !important;
          font-size: 11px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          color: ${textColor} !important;
        `;
      
      // 현재 선택된 캐릭터 하이라이트
      const isSelected = (position === 'left' && this.zetaAISpeaker2Voice.id === voice.id) ||
                        (position === 'right' && this.zetaAISpeaker1Voice.id === voice.id);
      
      if (isSelected) {
        characterItem.style.backgroundColor = 'rgba(34, 124, 255, 0.2) !important';
        characterItem.style.border = '1px solid rgba(34, 124, 255, 0.5) !important';
        characterItem.style.setProperty('text-decoration', 'underline', 'important');
        characterItem.style.setProperty('text-underline-offset', '3px', 'important');
        characterItem.style.setProperty('text-decoration-color', this.currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(29, 29, 29, 0.4)', 'important');
      }
      
      characterItem.textContent = voice.name;
      
      // 클릭 이벤트
      characterItem.addEventListener('click', () => {
        this.handleZetaAICharacterSelection(position, voice);
      });
      
      // 호버 효과 (테마에 맞게)
      characterItem.addEventListener('mouseenter', () => {
        if (!isSelected) {
          const isDark = this.currentTheme === 'dark';
          const hoverColor = isDark ? 'rgba(255, 255, 255, 0.1) !important' : 'rgba(0, 0, 0, 0.1) !important';
          characterItem.style.backgroundColor = hoverColor;
        }
      });
      
      characterItem.addEventListener('mouseleave', () => {
        if (!isSelected) {
          characterItem.style.backgroundColor = 'transparent !important';
        }
      });
      
      container.appendChild(characterItem);
    });
    
    document.body.appendChild(container);
    
    // UI 참조 저장
    if (position === 'left') {
      this.zetaAILeftCharacterUI = container;
    } else {
      this.zetaAIRightCharacterUI = container;
    }
  }

  // 🤖 Zeta AI / ChatGPT: 캐릭터 선택 처리
  handleZetaAICharacterSelection(position, selectedVoice) {
    if (!this.isZetaOrChatGPTMode()) {
      return;
    }
    
    this.log(`🤖 Zeta AI / ChatGPT 캐릭터 선택: ${position} - ${selectedVoice.name}`);
    
    if (position === 'left') {
      // 좌하단: 화자2 (AI 응답) 변경
      this.zetaAISpeaker2Voice = selectedVoice;
      this.log(`🤖 Zeta AI / ChatGPT 화자2 변경: ${selectedVoice.name}`);
    } else {
      // 우하단: 화자1 (사용자 질문) 변경
      this.zetaAISpeaker1Voice = selectedVoice;
      this.log(`🤖 Zeta AI / ChatGPT 화자1 변경: ${selectedVoice.name}`);
    }
    
    // UI 업데이트
    this.updateZetaAICharacterUI();
  }

  // 🤖 Zeta AI / ChatGPT: 캐릭터 UI 업데이트
  updateZetaAICharacterUI() {
    if (!this.isZetaOrChatGPTMode()) {
      return;
    }
    
    // 좌하단 UI 업데이트 (화자2)
    if (this.zetaAILeftCharacterUI) {
      const items = this.zetaAILeftCharacterUI.querySelectorAll('div[style*="cursor: pointer"]');
      items.forEach((item, index) => {
        const voice = this.VOICES[index];
        const isSelected = this.zetaAISpeaker2Voice.id === voice.id;
        
        if (isSelected) {
          item.style.backgroundColor = 'rgba(34, 124, 255, 0.2) !important';
          item.style.border = '1px solid rgba(34, 124, 255, 0.5) !important';
          item.style.setProperty('text-decoration', 'underline', 'important');
          item.style.setProperty('text-underline-offset', '3px', 'important');
          item.style.setProperty('text-decoration-color', this.currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(29, 29, 29, 0.4)', 'important');
        } else {
          item.style.backgroundColor = 'transparent !important';
          item.style.border = 'none !important';
          item.style.setProperty('text-decoration', 'none', 'important');
        }
      });
    }
    
    // 우하단 UI 업데이트 (화자1)
    if (this.zetaAIRightCharacterUI) {
      const items = this.zetaAIRightCharacterUI.querySelectorAll('div[style*="cursor: pointer"]');
      items.forEach((item, index) => {
        const voice = this.VOICES[index];
        const isSelected = this.zetaAISpeaker1Voice.id === voice.id;
        
        if (isSelected) {
          item.style.backgroundColor = 'rgba(34, 124, 255, 0.2) !important';
          item.style.border = '1px solid rgba(34, 124, 255, 0.5) !important';
          item.style.setProperty('text-decoration', 'underline', 'important');
          item.style.setProperty('text-underline-offset', '3px', 'important');
          item.style.setProperty('text-decoration-color', this.currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(29, 29, 29, 0.4)', 'important');
        } else {
          item.style.backgroundColor = 'transparent !important';
          item.style.border = 'none !important';
          item.style.setProperty('text-decoration', 'none', 'important');
        }
      });
    }
  }

  // 🤖 Zeta AI / ChatGPT: 캐릭터 UI 테마 업데이트
  updateZetaAICharacterUITheme() {
    if (!this.isZetaOrChatGPTMode()) {
      return;
    }
    
    this.log('🤖 Zeta AI / ChatGPT: 캐릭터 UI 테마 업데이트 시작');
    
    // 기존 캐릭터 UI 제거
    this.cleanupZetaAICharacterUI();
    
    // 새로운 테마로 캐릭터 UI 재생성
    this.createZetaAICharacterSelectionUI();
    
    this.log('🤖 Zeta AI / ChatGPT: 캐릭터 UI 테마 업데이트 완료');
  }
  
  // 🤖 Zeta AI 새로운 콘텐츠 오버레이 표시
  showZetaAINewContentOverlay(text) {
    // 기존 오버레이 제거
    const existingOverlay = document.getElementById('tts-zeta-ai-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    // 새로운 오버레이 생성
    const overlay = document.createElement('div');
    overlay.id = 'tts-zeta-ai-overlay';
    overlay.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      max-width: 80% !important;
      max-height: 60% !important;
      background: rgba(0, 0, 0, 0.9) !important;
      color: white !important;
      padding: 20px !important;
      border-radius: 8px !important;
      font-size: 16px !important;
      line-height: 1.5 !important;
      z-index: 100000 !important;
      text-align: center !important;
      overflow-y: auto !important;
      word-wrap: break-word !important;
    `;
    

    
    overlay.textContent = text;
    document.body.appendChild(overlay);
    
    // 1초 후 제거
    setTimeout(() => {
      if (overlay && overlay.parentNode) {
        overlay.remove();
      }
    }, 1000);
    
    this.log('🤖 Zeta AI 새로운 콘텐츠 오버레이 표시:', text.substring(0, 50) + '...');
  }

  // 🤖 Zeta AI 바뀐 테이크 자동 생성 및 발화
  async autoPlayZetaAITake(text, language) {
    if (!window.location.hostname.includes('zeta-ai')) {
      return; // Zeta AI 사이트가 아니면 실행하지 않음
    }
    
    this.log('🤖 Zeta AI 자동 발화 시작:', text.substring(0, 30) + '...');
    this.log('🤖 Zeta AI 언어:', language);
    
    try {
      // 기존 오디오 중지 (Zeta AI 자동 발화용)
      if (this.zetaAIAudio) {
        this.zetaAIAudio.pause();
        this.zetaAIAudio.currentTime = 0;
        this.zetaAIAudio = null;
      }
      
      // 🤖 Zeta AI: 화자별 음성 선택
      const currentVoice = this.zetaAICurrentSpeaker === 'speaker1' ? 
        this.zetaAISpeaker1Voice : this.zetaAISpeaker2Voice;
      
      this.log(`🤖 Zeta AI 화자별 음성 적용: ${this.zetaAICurrentSpeaker} (${currentVoice.name})`);
      
      // 현재 화자와 속도로 음성 생성 (제타 AI 전용 테이크 객체 생성)
      const zetaTake = {
        id: 'zeta-ai-take',
        text: text,
        language: language, // 테이크 분석 시점에 분석된 언어 사용
        element: null
      };
      
      // 🤖 Zeta AI: 화자별 음성으로 임시 설정 변경
      const originalVoice = this.selectedVoice;
      this.selectedVoice = currentVoice;
      
      const audioUrl = await this.convertToSpeech(zetaTake);
      
      // 🤖 Zeta AI: 원래 음성으로 복원
      this.selectedVoice = originalVoice;
      
      if (audioUrl) {
        // Zeta AI 전용 오디오 객체 생성
        this.zetaAIAudio = new Audio(audioUrl);
        this.zetaAIAudio.volume = 1.0; // 기본 볼륨
        
        // 재생 완료 시 정리
        this.zetaAIAudio.addEventListener('ended', () => {
          this.log('🤖 Zeta AI 자동 발화 완료');
          this.zetaAIAudio = null;
        });
        
        // 오류 처리
        this.zetaAIAudio.addEventListener('error', (error) => {
          this.error('🤖 Zeta AI 자동 발화 오류:', error);
          this.zetaAIAudio = null;
        });
        
        // 자동 발화 시작
        await this.zetaAIAudio.play();
        this.log('🤖 Zeta AI 자동 발화 재생 중...');
        
      } else {
        this.error('🤖 Zeta AI 음성 생성 실패');
      }
      
    } catch (error) {
      this.error('🤖 Zeta AI 자동 발화 실패:', error);
    }
  }

  // 🔄 공용 리프레시 요청 함수
  async requestRefresh() {
    this.log('🔄 리프레시 요청: 글감 재수집 시작');
    
    // 새로고침 아이콘만 회전 애니메이션 시작 (반시계방향)
    if (this.refreshButton) {
      const refreshIcon = this.refreshButton.querySelector('.refresh-icon');
      if (refreshIcon) {
        refreshIcon.style.transform = 'rotate(-360deg)';
        refreshIcon.style.transition = 'transform 0.5s ease-in-out';
      }
    }
    
    // 상태 업데이트
    this.updateStatus('글감 재수집 중...', '#FF9800');
    
    try {
      // 기존 테이크 초기화
      this.preTakes = [];
      this.currentPlayList = [];
      this.currentTakeIndex = 0;
      this.currentPlayingTakeId = null;
      
      // 현재 페이지 기준으로 글감 재수집
      await this.analyzePageAndCreateTakes();
      
      // 재수집 결과 확인
      if (this.preTakes && this.preTakes.length > 0) {
        this.log(`✅ 글감 재수집 완료: ${this.preTakes.length}개 테이크`);
        this.updateStatus(`재수집 완료 (${this.preTakes.length}개)`, '#4CAF50');
        this.updateTakeCount();
        
        // 우하단 플로팅 UI 다시 표시
        this.showUI();
        
        // 🤖 Zeta AI 모니터링 시작
        this.startZetaAIMonitoring();
      } else {
        this.log('⚠️ 재수집된 테이크가 없습니다');
        this.updateStatus('재수집된 내용이 없습니다', '#F44336');
      }
      
    } catch (error) {
      this.error('글감 재수집 실패:', error);
      this.updateStatus('재수집 실패', '#F44336');
    } finally {
      // 애니메이션 완료 후 아이콘만 원래 상태로 복원
      setTimeout(() => {
        if (this.refreshButton) {
          const refreshIcon = this.refreshButton.querySelector('.refresh-icon');
          if (refreshIcon) {
            refreshIcon.style.transition = 'none';
            refreshIcon.style.transform = 'rotate(0deg)';
            // 다음 애니메이션을 위해 transition 복원
            setTimeout(() => {
              if (refreshIcon) {
                refreshIcon.style.transition = 'transform 0.5s ease-in-out';
              }
            }, 10);
          }
        }
      }, 500);
    }
  }

  // 🔄 새로고침 버튼 클릭 처리
  async handleRefreshButtonClick() {
    await this.requestRefresh();
  }

  // 🎯 첫 번째 테이크부터 읽기 시작
  async startReadingFromFirst() {
    // 수집된 첫 번째 테이크 자동 재생
    if (this.preTakes && this.preTakes.length > 0) {
      this.log('🎯 "읽어 보세요" 클릭: 수집된 테이크로 자동 재생 시작');
      await this.startPlaybackFromTake(this.preTakes[0]);
    } else {
      this.log('🔍 "읽어 보세요" 클릭: 테이크가 없어서 페이지 분석 시작');
      this.updateStatus('페이지 분석 중...', '#FF9800');
      // 페이지 분석 후 첫 번째 테이크 재생
      try {
        await this.analyzePageAndCreateTakes();
        if (this.preTakes && this.preTakes.length > 0) {
          await this.startPlaybackFromTake(this.preTakes[0]);
        } else {
          this.updateStatus('읽을 내용을 찾을 수 없습니다', '#F44336');
        }
      } catch (error) {
        this.error('페이지 분석 실패:', error);
        this.updateStatus('페이지 분석 실패', '#F44336');
      }
    }
  }

  // 🎯 화자 변경 메뉴 표시
  // 🎵 음성 메뉴 표시 (app.js PopupCard 스타일)
  showVoiceMenu() {
    // 기존 메뉴 제거
    if (this.voiceMenuPopup) {
      this.voiceMenuPopup.remove();
    }

    // 테마 색상 가져오기 (하단 플로팅과 동일한 스타일)
    const isDark = this.currentTheme === 'dark';
    const bgColor = isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.6)' : '#1d1d1d';
    const borderColor = isDark ? 'rgba(255, 255, 255, 1.0)' : 'rgba(29, 29, 29, 0.3)';
    
    // 팝업 카드 컨테이너 생성 (app.js PopupCard 스타일)
    this.voiceMenuPopup = document.createElement('div');
    this.voiceMenuPopup.id = 'tts-voice-menu-popup';
    this.voiceMenuPopup.style.cssText = `
      position: fixed !important;
      bottom: 0 !important;
      left: 50% !important;
      transform: translate(-50%, 0) !important;
      width: 60% !important;
      min-height: 40vh !important;
      max-height: 60vh !important;
      background: ${bgColor} !important;
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
      border: 1px solid rgba(125, 125, 125, 0.2) !important;
      border-radius: 3px !important;
      box-shadow: 0px 0px 60px ${textColor}50 !important;
      z-index: 100002 !important;
      line-height: 1.5rem !important;
      padding: 0 !important;
      overflow-y: auto !important;
      -ms-overflow-style: none !important;
      scrollbar-width: none !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      animation: slideIn 0.7s ease forwards !important;
    `;
    
    // 애니메이션 키프레임 추가 (app.js 스타일)
    if (!document.getElementById('tts-voice-menu-keyframes')) {
      const style = document.createElement('style');
      style.id = 'tts-voice-menu-keyframes';
      style.textContent = `
        @keyframes slideIn {
          0% { transform: translate(-50%, calc(100% + 80px)) rotate(0deg); opacity: 1; }
          100% { transform: translate(-50%, 0) rotate(0deg); opacity: 1; }
        }
        @keyframes slideOut {
          0% { transform: translate(-50%, 0) rotate(0deg); visibility: visible; opacity: 1; }
          99.9% { transform: translate(-50%, calc(100% + 80px)) rotate(0deg); visibility: visible; opacity: 1; }
          100% { transform: translate(-50%, calc(100% + 80px)) rotate(0deg); visibility: hidden; opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // 스크롤바 숨기기
    this.voiceMenuPopup.style.setProperty('-webkit-scrollbar', 'none', 'important');
    
    // 제목 추가 (app.js Typography 스타일)
    const title = document.createElement('div');
    title.style.cssText = `
      margin-bottom: 24px !important;
      font-weight: 400 !important;
      -webkit-text-stroke: 0.03em !important;
      paint-order: stroke fill !important;
      color: ${textColor} !important;
      padding: 24px 24px 0 24px !important;
      text-align: left !important;
      text-transform: none !important;
              font-size: ${this.UI_FONT_SIZE} !important;
    `;
    title.textContent = '읽는 이';
    this.voiceMenuPopup.appendChild(title);

    // 각 음성 옵션 생성 (app.js 스타일)
    this.VOICES.forEach((voice) => {
      const voiceOption = document.createElement('div');
      voiceOption.style.cssText = `
        padding: 5px 24px 10px 24px !important;
        cursor: pointer !important;
        border-radius: 8px !important;
        -webkit-tap-highlight-color: rgba(139, 69, 19, 0.1) !important;
        transition: background-color 0.2s !important;
      `;
      
      // Typography 컨테이너 (app.js 스타일)
      const typography = document.createElement('div');
      typography.style.cssText = `
        text-align: left !important;
        text-transform: none !important;
      `;
      
      // 음성 이름 (언더라인 있음, 하단 플로팅과 동일한 스타일)
      const voiceName = document.createElement('span');
      voiceName.style.cssText = `
        color: ${textColor} !important;
        text-decoration: underline !important;
        text-underline-offset: 5px !important;
        text-decoration-color: ${this.currentTheme === 'dark' ? 'rgba(170, 170, 170, 0.4)' : 'rgba(29, 29, 29, 0.4)'} !important;
        cursor: inherit !important;
        display: inline !important;
        font-size: ${this.UI_FONT_SIZE} !important;
      `;
      voiceName.textContent = voice.name;
      
      // 음성 설명 (다크모드: 0.4 투명도, 라이트모드: 기본)
      const voiceDescription = document.createElement('span');
      voiceDescription.style.cssText = `
        color: ${this.currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : textColor} !important;
        white-space: pre-line !important;
        cursor: default !important;
        font-size: ${this.UI_FONT_SIZE} !important;
      `;
      voiceDescription.textContent = voice.description;
      
      typography.appendChild(voiceName);
      typography.appendChild(voiceDescription);
      voiceOption.appendChild(typography);
      
      // 클릭 이벤트 (app.js 스타일)
      voiceOption.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.selectVoice(voice);
        this.hideVoiceMenu();
      });

      // 호버 효과 (app.js 스타일)
      voiceOption.addEventListener('mouseenter', () => {
        voiceOption.style.backgroundColor = 'rgba(139, 69, 19, 0.1) !important';
      });

      voiceOption.addEventListener('mouseleave', () => {
        voiceOption.style.backgroundColor = 'transparent !important';
      });

      this.voiceMenuPopup.appendChild(voiceOption);
    });
    
    // 하단 여백 추가 (app.js 스타일)
    const bottomSpacer = document.createElement('div');
    bottomSpacer.style.cssText = 'height: 30px !important;';
    this.voiceMenuPopup.appendChild(bottomSpacer);

    // 백드롭 생성 (외곽 클릭 감지용)
    this.voiceMenuBackdrop = document.createElement('div');
    this.voiceMenuBackdrop.id = 'tts-voice-menu-backdrop';
    this.voiceMenuBackdrop.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: transparent !important;
      z-index: 99999 !important;
    `;
    
    // 백드롭 클릭 시 메뉴 닫기
    this.voiceMenuBackdrop.addEventListener('click', () => {
      this.hideVoiceMenu();
    });
    
    // 문서에 추가 (백드롭 먼저, 그 다음 메뉴)
    document.body.appendChild(this.voiceMenuBackdrop);
    document.body.appendChild(this.voiceMenuPopup);
    
    // 외부 클릭 시 메뉴 숨기기
    setTimeout(() => {
      document.addEventListener('click', this.handleVoiceMenuOutsideClick.bind(this));
    }, 0);
  }

  // 🎯 화자 변경 메뉴 숨기기 (app.js 스타일)
  hideVoiceMenu() {
    if (this.voiceMenuPopup) {
      // 슬라이드 아웃 애니메이션 (app.js 스타일)
      this.voiceMenuPopup.style.animation = 'slideOut 0.2s ease forwards !important';
      
      setTimeout(() => {
        if (this.voiceMenuPopup) {
          this.voiceMenuPopup.remove();
          this.voiceMenuPopup = null;
        }
        if (this.voiceMenuBackdrop) {
          this.voiceMenuBackdrop.remove();
          this.voiceMenuBackdrop = null;
        }
      }, 200);
    }
  }

  // 🎯 화자 선택
  async selectVoice(voice) {
    const previousVoiceId = this.selectedVoice.id;
    this.selectedVoice = voice;
    
    // 화자 설정 저장
    await this.saveVoiceSetting(voice);
    
    this.log(`🎤 화자 변경: ${voice.name} (${voice.id})`);
    
    // 화자가 실제로 변경된 경우에만 처리
    if (previousVoiceId !== voice.id) {
      this.handleVoiceOrSpeedChange();
    }
    
    // 하단 플로팅 UI 상태 업데이트
    this.updateBottomFloatingUIState();
    
    // 화자 변경 팝업의 선택 상태도 업데이트
    if (this.voiceMenuPopup) {
      this.updateVoiceMenuSelection(voice.id);
    }
    
    // 기존 UI도 업데이트
    this.updateStatus(`화자 변경: ${voice.name}`, '#4CAF50');
  }

  // 🎤 화자/속도 변경 처리 (기존 테이크 재생 로직 활용)
  handleVoiceOrSpeedChange() {
    this.log('🎤 화자/속도 변경으로 인한 재시작 처리 시작');
    
    // 현재 재생 중인 테이크가 있는 경우에만 처리
    if (this.isPlaying && this.currentPlayList && this.currentTakeIndex >= 0) {
      const currentTake = this.currentPlayList[this.currentTakeIndex];
      if (currentTake) {
        // 모든 버퍼링 제거
        this.clearAllBuffering();
        
        // 현재 재생 중지
        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio = null;
        }
        
        // 단어 트래킹 중지
        this.stopWordTracking();
        
        // 기존 테이크 재생 로직을 사용하여 현재 테이크부터 다시 시작
        this.log(`🎯 현재 테이크부터 새로운 설정으로 재시작: ${currentTake.id} (${this.currentTakeIndex + 1}/${this.currentPlayList.length})`);
        
        // 상태를 재생 중으로 유지하고 현재 테이크부터 재생
        this.isPlaying = true;
        this.isPaused = false;
        this.updateBottomFloatingUIState();
        
        // 기존 테이크 재생 로직 활용
        this.playTakeAtIndex(this.currentTakeIndex);
      }
    }
  }

  // 🎤 화자 변경 처리 (레거시 - 호환성 유지)
  handleVoiceChange() {
    this.log('🎤 화자 변경으로 인한 재시작 처리 시작');
    
    // 1. 현재 재생 상태 저장
    const wasPlaying = this.isPlaying;
    const currentTakeIndex = this.currentTakeIndex;
    const currentPlayList = this.currentPlayList;
    
    // 2. 모든 버퍼링 제거
    this.clearAllBuffering();
    
    // 3. 현재 오디오 정지
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    
    // 4. 상태 초기화
    this.isPlaying = false;
    this.isPaused = false;
    
    // 5. 재생 중이었다면 현재 테이크부터 새 목소리로 재시작
    if (wasPlaying && currentPlayList && currentPlayList.length > 0 && currentTakeIndex >= 0) {
      this.log(`🎤 마지막 테이크 ${currentTakeIndex + 1}번부터 새 목소리로 재시작`);
      this.updateStatus(`새 목소리로 재시작 중...`, '#FF9800');
      
      // 잠시 후 재시작 (UI 업데이트 후)
      setTimeout(() => {
        this.playTakeAtIndex(currentTakeIndex);
      }, 500);
    } else {
      // 재생 중이 아니었다면 단순히 상태만 업데이트
      this.updateBottomFloatingUIState();
    }
  }

  // 🗑️ 모든 버퍼링 제거
  clearAllBuffering() {
    this.log('🗑️ 모든 버퍼링 제거 시작');
    
    // 1. audioBuffer의 모든 URL 해제
    Object.values(this.audioBuffer).forEach(url => {
      if (url && typeof url === 'string' && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
        this.log(`🗑️ 버퍼 URL 해제: ${url.substring(0, 30)}...`);
      }
    });
    
    // 2. audioBuffer 초기화
    this.audioBuffer = {};
    
    // 3. 버퍼링 진행 중인 테이크들 중단
    this.bufferingTakes.clear();
    
    // 4. AbortController로 진행 중인 요청 중단
    if (this.abortController) {
      this.abortController.abort();
      this.log('🗑️ 진행 중인 TTS 요청 중단');
    }
    this.abortController = new AbortController();
    
    // 5. 플레이리스트의 버퍼링 상태 초기화
    if (this.currentPlayList) {
      this.currentPlayList.forEach(take => {
        take.isBuffered = false;
        take.audioUrl = null;
      });
    }
    
    this.log('✅ 모든 버퍼링 제거 완료');
  }

  // 🎯 화자 메뉴에서 선택 상태 업데이트
  updateVoiceMenuSelection(selectedVoiceId) {
    if (!this.voiceMenuPopup) return;

    const voiceOptions = this.voiceMenuPopup.querySelectorAll('div[data-voice-id]');
    voiceOptions.forEach(option => {
      const voiceId = option.dataset.voiceId;
      const voiceName = option.querySelector('span');
      
      if (voiceId === selectedVoiceId) {
        // 선택된 화자 스타일 적용
        option.style.background = 'rgba(255, 255, 255, 0.1) !important';
        if (voiceName) {
          voiceName.style.color = '#4CAF50 !important';
        }
      } else {
        // 선택되지 않은 화자 스타일 제거
        option.style.background = 'transparent !important';
        if (voiceName) {
          voiceName.style.color = 'white !important';
        }
      }
    });
  }

  // 🎯 재생/일시정지 제어
  pausePlayback() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.isPaused = true;
      this.isPlaying = true; // 일시정지 상태에서도 isPlaying은 true
      this.updateBottomFloatingUIState();
      this.updateStatus('일시정지됨', '#FF9800');
      this.log('⏸️ 재생 일시정지');
    }
  }

  resumePlayback() {
    if (this.currentAudio && this.isPaused) {
      this.currentAudio.play();
      this.isPaused = false;
      this.isPlaying = true;
      this.updateBottomFloatingUIState();
      this.updateStatus(`재생 중... (${this.currentPlayListIndex + 1}/${this.currentPlayList.length})`, '#4CAF50');
      this.log('▶️ 재생 재개');
    }
  }

  // TTS 시작
  // 🎯 호환성을 위한 startTTS 래퍼 (레거시 시스템용)
  async startTTS(text, elementMetadata = null) {
    // 플러그인이 비활성화된 경우 TTS 중지
    if (!this.isPluginEnabled) {
      return;
    }
    
    this.log('⚠️ 레거시 startTTS 호출됨 - 새로운 시스템은 마우스 위치 기반입니다');
    this.log('텍스트:', text?.substring(0, 50) + '...');
    
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
        this.log('선택된 요소에서 전체 텍스트 추출 완료');
      } else {
        this.log('원본 텍스트 사용 (추출 실패 또는 부족)');
      }
    }
    
    this.log('원본 텍스트 길이:', text.length);
    this.log('처리할 텍스트 길이:', targetText.length);
    this.log('텍스트 샘플:', targetText.substring(0, 100) + '...');
    
    // 🎯 기본 최대 길이 설정 (테이크별로 동적 조정)
    const defaultMaxLength = 250;
    this.log(`텍스트 분할 시작 - 기본 최대 길이: ${defaultMaxLength}자`);
    
    const takes = [];
    let takeNumber = 1;

    // 1차 분할: 공백/탭만 있는 줄이 2번 이상 연속될 때마다 분할 (문단 구분)
    const blocks = targetText.split(/(?:[ \t]*\r?\n){2,}/);
    this.log(`문단 분할: ${blocks.length}개 블록`);

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
          this.log(`✅ 테이크 ${takeNumber}: ${currentLanguage} (${remainingText.length}자)`);
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
          this.log(`✅ 테이크 ${takeNumber}: ${currentLanguage} (${takeText.length}자)`);
          takeNumber++;
        }
        
        remainingText = remainingText.slice(cutIndex).trim();
      }
    }
    
    this.log(`최종 테이크 개수: ${takes.length}`);
    takes.forEach((take, index) => {
      this.log(`🎯 테이크 ${index + 1} [${take.language}]: ${take.text.substring(0, 50)}... (${take.text.length}자)`);
    });
    
    return takes;
  }
  
  // 📍 테이크별 DOM 요소 정보 찾기
  findTakeElementInfo(takeText, sourceMetadata, sourceElement) {
    if (!sourceElement) {
      this.log('소스 요소 없음, 기본 메타데이터 사용');
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
      this.log(`테이크 "${takeText.substring(0, 30)}..." → ${elementDesc}: <${elementType}>.${targetElement.className}`);
      
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
      this.log(`테이크 "${takeText.substring(0, 30)}..." → 📦 원본 요소 사용`);
      
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
    
    this.log(`테이크 컨테이너 탐색 - 키워드: "${keywordSample}"`);
    
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
      this.log(`🎯 최적 컨테이너 발견: <${bestCandidate.element.tagName.toLowerCase()}>, 점수: ${bestCandidate.score.toFixed(2)}, 텍스트 길이: ${bestCandidate.textLength}`);
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

  // 최적의 분할 위치 찾기 (App.js 로직 참고, 일본어 문장 기호 포함)
  findBestCutPosition(text, maxLength) {
    // 1순위: 기본 문장 끝 기호들
    const lastPeriod = text.lastIndexOf('.', maxLength);
    const lastExclam = text.lastIndexOf('!', maxLength);
    const lastQuestion = text.lastIndexOf('?', maxLength);
    const lastTilde = text.lastIndexOf('~', maxLength);
    
    // 🇯🇵 일본어 문장 끝 기호들 (App.js 참고)
    const lastJapanesePeriod = text.lastIndexOf('。', maxLength);      // 일본어 마침표
    const lastJapaneseComma = text.lastIndexOf('、', maxLength);       // 일본어 독점 (쉼표)
    const lastJapaneseExclam = text.lastIndexOf('！', maxLength);      // 일본어 느낌표
    const lastJapaneseQuestion = text.lastIndexOf('？', maxLength);    // 일본어 물음표
    
    // 🇯🇵 일본어 특수 문장 기호들
    const lastJapaneseQuote1 = text.lastIndexOf('」', maxLength);      // 일본어 닫는 따옴표
    const lastJapaneseQuote2 = text.lastIndexOf('』', maxLength);      // 일본어 이중 닫는 따옴표
    const lastJapaneseQuote3 = text.lastIndexOf('〉', maxLength);      // 일본어 꺾쇠
    const lastJapaneseQuote4 = text.lastIndexOf('》', maxLength);      // 일본어 이중 꺾쇠
    
    // 일반 따옴표들
    const lastQuote1 = text.lastIndexOf('"', maxLength);
    const lastQuote2 = text.lastIndexOf('"', maxLength);
    const lastQuote3 = text.lastIndexOf("'", maxLength);
    const lastQuote4 = text.lastIndexOf("'", maxLength);
    
    // 1순위: 완전한 문장 끝 기호들 (일본어 포함)
    const sentenceEndCandidates = [
      lastPeriod, lastExclam, lastQuestion, lastTilde, 
      lastJapanesePeriod, lastJapaneseComma, lastJapaneseExclam, lastJapaneseQuestion,
      lastJapaneseQuote1, lastJapaneseQuote2, lastJapaneseQuote3, lastJapaneseQuote4,
      lastQuote1, lastQuote2, lastQuote3, lastQuote4
    ].filter(idx => idx > 0);
    
    // 2순위: 절 구분 기호들 (쉼표, 세미콜론 등)
    const lastComma = text.lastIndexOf(',', maxLength);
    const lastSemicolon = text.lastIndexOf(';', maxLength);
    const lastColon = text.lastIndexOf(':', maxLength);
    
    // 🇯🇵 일본어 절 구분 기호들
    const lastJapaneseMiddleDot = text.lastIndexOf('・', maxLength);    // 일본어 중점
    const lastJapaneseColon = text.lastIndexOf('：', maxLength);       // 일본어 콜론
    const lastJapaneseSemicolon = text.lastIndexOf('；', maxLength);   // 일본어 세미콜론
    
    const clauseEndCandidates = [
      lastComma, lastSemicolon, lastColon,
      lastJapaneseMiddleDot, lastJapaneseColon, lastJapaneseSemicolon
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

  // 🆕 선택된 요소의 모든 텍스트 추출 (DOM 탐색에서 이미 검증된 요소용)
  extractAllTextFromElement(element) {
    return window.htmlAnalyzerCommon.extractAllTextFromElement(element);
  }

  // 🔍 본문 콘텐츠인지 판단 (제목, 캡션 포함)
  isMainContentText(element, text) {
    const hostname = window.location.hostname.toLowerCase();
    
    // 🎯 사이트별 특화 본문 텍스트 판단
    const siteSpecificResult = window.htmlAnalyzerSites.isSiteSpecificMainContent(hostname, element, text);
    if (siteSpecificResult !== null) {
      return siteSpecificResult;
    }
    
    // 공통 로직
    return window.htmlAnalyzerCommon.isMainContentText(element, text);
  }

  // 🎯 중요한 콘텐츠인지 판단 (제목, 캡션, 의미 있는 메타데이터)
  isImportantContent(element, text) {
    return window.htmlAnalyzerCommon.isImportantContent(element, text);
  }

  // 🔍 제외할 요소 판단 (버튼, 메타데이터, 접근성 텍스트 등)
  isExcludedElement(element) {
    const hostname = window.location.hostname.toLowerCase();
    const className = (element.className || '').toLowerCase();
    const elementId = (element.id || '').toLowerCase();
    
    // 🎯 사이트별 특화 제외 로직
    if (window.htmlAnalyzerSites.isSiteSpecificExcludedElement(hostname, element, className, elementId)) {
      return true;
    }
    
    // 공통 제외 로직
    return window.htmlAnalyzerCommon.isExcludedElement(element);
  }

  // 화면에 보이는 텍스트만 추출
  extractVisibleText() {
    return window.htmlAnalyzerCommon.extractVisibleText();
  }

  // 요소가 화면에 보이는지 확인
  isElementVisible(element) {
    return window.htmlAnalyzerCommon.isElementVisible(element);
  }

  // 언어 감지
  // 🎯 개선된 언어 감지 로직 (일본어 포함, App.js 기반)
  async detectLanguage(text) {
    // 텍스트 정리 (공백, 숫자, 기본 문장부호 제외하고 실제 문자만)
    const cleanText = text.replace(/[\s\d\p{P}]/gu, '');
    
    // 🇰🇷 한글 패턴 (한글 자음, 모음, 완성형 한글)
    const koreanPattern = /[ㄱ-ㅎㅏ-ㅣ가-힣]/g;
    
    // 🇺🇸 영문 패턴 (알파벳만)
    const englishPattern = /[a-zA-Z]/g;
    
    // 🇯🇵 일본어 패턴
    const hiraganaPattern = /[ひらがな\u3040-\u309F]/g;     // 히라가나
    const katakanaPattern = /[カタカナ\u30A0-\u30FF]/g;     // 가타카나
    const kanjiPattern = /[一-龯]/g;                        // 한자 (일본어 문맥)
    
    // 일본어 특유의 문자 조합 패턴
    const japaneseParticles = /[はがのをにでと]/g;           // 일본어 조사
    const japaneseEndings = /[ますですだった]/g;              // 일본어 어미
    
    const koreanMatches = cleanText.match(koreanPattern) || [];
    const englishMatches = cleanText.match(englishPattern) || [];
    const hiraganaMatches = cleanText.match(hiraganaPattern) || [];
    const katakanaMatches = cleanText.match(katakanaPattern) || [];
    const kanjiMatches = cleanText.match(kanjiPattern) || [];
    const particleMatches = cleanText.match(japaneseParticles) || [];
    const endingMatches = cleanText.match(japaneseEndings) || [];
    
    const koreanCount = koreanMatches.length;
    const englishCount = englishMatches.length;
    const hiraganaCount = hiraganaMatches.length;
    const katakanaCount = katakanaMatches.length;
    const kanjiCount = kanjiMatches.length;
    const japaneseGrammarCount = particleMatches.length + endingMatches.length;
    
    // 일본어 총 문자수 (히라가나 + 가타카나 + 일본어 맥락의 한자)
    const japaneseCount = hiraganaCount + katakanaCount + (kanjiCount * 0.7); // 한자는 70% 가중치
    const totalLetters = koreanCount + englishCount + japaneseCount;
    
    this.log(`언어 감지 분석: "${text.substring(0, 30)}..."`);
    this.log(`한글: ${koreanCount}자, 영문: ${englishCount}자, 일본어: ${japaneseCount.toFixed(1)}자`);
    this.log(`  ㄴ 히라가나: ${hiraganaCount}, 가타카나: ${katakanaCount}, 한자: ${kanjiCount}, 문법: ${japaneseGrammarCount}`);
    
    // 텍스트가 너무 짧으면 기본값 한국어
    if (totalLetters < 5) {
      this.log('텍스트가 너무 짧음 → 기본값 한국어');
      return 'ko';
    }
    
    // 각 언어 비율 계산
    const koreanRatio = koreanCount / totalLetters;
    const englishRatio = englishCount / totalLetters;
    const japaneseRatio = japaneseCount / totalLetters;
    
    this.log(`비율 - 한글: ${(koreanRatio * 100).toFixed(1)}%, 영문: ${(englishRatio * 100).toFixed(1)}%, 일본어: ${(japaneseRatio * 100).toFixed(1)}%`);
    
    // 🎯 일본어 우선 감지 (일본어 글자가 5% 이상이면 일본어)
    if (hiraganaCount > 0 || katakanaCount > 0 || japaneseGrammarCount > 0) {
      if (japaneseRatio >= 0.05 || japaneseGrammarCount >= 1) {  // 일본어 비율 5% 이상 또는 문법 요소 1개 이상
        this.log('→ 일본어로 감지 (일본어 글자 5% 이상 또는 문법 요소 발견)');
        return 'ja';
      }
    }
    
    // 🎯 한국어 감지
    if (koreanRatio >= 0.3) {  // 한글이 30% 이상이면 한국어
      this.log('→ 한국어로 감지');
      return 'ko';
    }
    
    // 🎯 영어 감지
    if (englishRatio >= 0.7) {  // 영문이 70% 이상이면 영어
      this.log('→ 영어로 감지');
      return 'en';
    }
    
    // 🎯 상대적 비교로 최종 결정
    if (japaneseCount > koreanCount && japaneseCount > englishCount) {
      this.log('→ 일본어 문자수 우세로 일본어');
      return 'ja';
    } else if (koreanCount > englishCount) {
      this.log('→ 한글 문자수 우세로 한국어');
      return 'ko';
    } else if (englishCount > 0) {
      this.log('→ 영문 문자수 우세로 영어');
      return 'en';
    } else {
      this.log('→ 기본값 한국어');
      return 'ko';
    }
  }

  // 테이크 생성 및 재생 (버퍼링 최적화)
  async generateAndPlayTake(takeIndex) {
    // 플러그인이 비활성화된 경우 재생 중지
    if (!this.isPluginEnabled) {
      return;
    }
    
    if (takeIndex >= this.takes.length) return;
    
    const take = this.takes[takeIndex];
    
    try {
      let audioUrl;
      
      // 🎯 메모리 최적화: 새로운 캐시 시스템 사용
      const cacheKey = `take_${takeIndex}_${this.selectedVoice.id}`;
      const cachedAudio = this.getFromAudioCache(cacheKey);
      
      if (cachedAudio) {
        this.log(`테이크 ${takeIndex + 1} 캐시에서 즉시 재생`);
        audioUrl = cachedAudio;
        this.updateStatus(`재생 중... (${takeIndex + 1}/${this.takes.length})`, '#4CAF50');
      } else {
        // 캐시되지 않은 경우에만 생성
        this.log(`테이크 ${takeIndex + 1} 실시간 생성 중...`);
        this.updateStatus(`음성 생성 중... (${takeIndex + 1}/${this.takes.length})`, '#FF9800');
        audioUrl = await this.convertToSpeech(take);
        this.addToAudioCache(cacheKey, audioUrl);
      }
      
      // 오디오 재생
      await this.playAudio(audioUrl, takeIndex);
      
    } catch (error) {
      this.error(`테이크 ${takeIndex + 1} 처리 실패:`, error);
      this.updateStatus('재생 실패', '#F44336');
    }
  }

  // 🔍 멀티 청크 필요 여부 확인
  needsMultiChunk(text, language) {
    const maxLength = language === 'en' ? 300 : 200;
    return text.length > maxLength;
  }

  // 🔄 텍스트를 적절한 크기로 분할
  smartChunkSplit(text, language) {
    const maxLength = language === 'en' ? 300 : 200;
    const chunks = [];
    let remainingText = text;
    
    while (remainingText.length > maxLength) {
      const cutIndex = this.findBestCutPosition(remainingText, maxLength);
      chunks.push(remainingText.slice(0, cutIndex).trim());
      remainingText = remainingText.slice(cutIndex).trim();
    }
    
    if (remainingText.length > 0) {
      chunks.push(remainingText);
    }
    
    this.log(`📝 텍스트 분할 완료: ${chunks.length}개 청크`, chunks.map((chunk, i) => `${i+1}: "${chunk.substring(0, 30)}..."`));
    return chunks;
  }

  // 🎵 단일 청크 TTS 생성
  async generateSingleChunkAudio(text, voice, language, chunkIndex = 0) {
    const requestData = {
      text: text,
      voice_id: voice.id,
      language: language,
      style: voice.id === '6151a25f6a7f5b1e000023' ? 'excited' : 'neutral',
      model: 'sona_speech_1',
      speed: this.playbackSpeed,
      voice_settings: {
        pitch_shift: 0,
        pitch_variance: 1,
        speed: this.playbackSpeed
      }
    };

    this.log(`🎵 청크 ${chunkIndex + 1} TTS 생성 중...`);
    
    const response = await fetch(`${this.apiUrl}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
      signal: this.abortController?.signal
    });

    if (!response.ok) {
      throw new Error(`TTS API 오류: ${response.status} - ${response.statusText}`);
    }

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  }

  // 🔗 오디오 파일들을 하나로 병합
  async mergeAudioUrls(audioUrls) {
    this.log(`🔗 ${audioUrls.length}개 오디오 파일 병합 시작...`);
    
    try {
      // 모든 오디오 파일을 AudioBuffer로 변환
      const audioBuffers = await Promise.all(
        audioUrls.map(async (url, index) => {
          this.log(`📥 오디오 ${index + 1} 로딩 중...`);
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          return await audioContext.decodeAudioData(arrayBuffer);
        })
      );

      this.log('📊 오디오 버퍼 정보:', audioBuffers.map((buffer, i) => 
        `${i+1}: ${buffer.duration.toFixed(2)}초, ${buffer.sampleRate}Hz`
      ));

      // 병합된 오디오 버퍼 생성
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
      const sampleRate = audioBuffers[0].sampleRate;
      const numberOfChannels = audioBuffers[0].numberOfChannels;

      const mergedBuffer = audioContext.createBuffer(numberOfChannels, totalLength, sampleRate);

      // 오디오 데이터 복사
      let offset = 0;
      for (const buffer of audioBuffers) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          mergedBuffer.getChannelData(channel).set(buffer.getChannelData(channel), offset);
        }
        offset += buffer.length;
      }

      this.log(`🎵 병합 완료: 총 ${mergedBuffer.duration.toFixed(2)}초`);

      // AudioBuffer를 Blob으로 변환
      const length = mergedBuffer.length;
      const audioData = new Float32Array(length * numberOfChannels);
      
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelData = mergedBuffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          audioData[i * numberOfChannels + channel] = channelData[i];
        }
      }

      // WAV 파일로 인코딩
      const wavBlob = this.encodeWAV(audioData, sampleRate, numberOfChannels);
      const mergedUrl = URL.createObjectURL(wavBlob);

      // 임시 URL들 정리
      audioUrls.forEach(url => URL.revokeObjectURL(url));

      return mergedUrl;

    } catch (error) {
      this.error('🔗 오디오 병합 실패:', error);
      throw error;
    }
  }

  // 🎵 WAV 인코딩 헬퍼
  encodeWAV(audioData, sampleRate, numberOfChannels) {
    const length = audioData.length;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    
    // WAV 헤더 작성
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // 오디오 데이터 작성
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  // 🔄 멀티 청크 TTS 생성
  async generateMultiChunkAudio(take) {
    const chunks = this.smartChunkSplit(take.text, take.language);
    this.log(`🔄 멀티청크 TTS 시작: ${take.id} (${chunks.length}개 청크)`);
    
    // 진행률 표시 초기화
    this.updateStatus(`음성 생성 중... 0/${chunks.length}`, '#FF9800');
    
    try {
      // 병렬로 모든 청크 생성
      const audioPromises = chunks.map((chunk, index) => 
        this.generateSingleChunkAudio(chunk, this.selectedVoice, take.language, index)
      );
      
      const audioUrls = [];
      
      // 하나씩 완료되는 대로 진행률 업데이트
      for (let i = 0; i < audioPromises.length; i++) {
        try {
          const audioUrl = await audioPromises[i];
          audioUrls.push(audioUrl);
          this.updateStatus(`음성 생성 중... ${i + 1}/${chunks.length}`, '#FF9800');
          this.log(`✅ 청크 ${i + 1}/${chunks.length} 완료`);
        } catch (error) {
          this.error(`❌ 청크 ${i + 1} 생성 실패:`, error);
          throw error;
        }
      }
      
      // 오디오 병합
      this.updateStatus('음성 병합 중...', '#FF9800');
      const mergedAudioUrl = await this.mergeAudioUrls(audioUrls);
      
      this.log(`🎉 멀티청크 TTS 완료: ${take.id}`);
      return mergedAudioUrl;
      
    } catch (error) {
      this.error(`❌ 멀티청크 TTS 실패: ${take.id}`, error);
      throw error;
    }
  }

  // 음성 변환 (메인 진입점)
  async convertToSpeech(take) {
    // 플러그인이 비활성화된 경우 변환 중지
    if (!this.isPluginEnabled) {
      return null;
    }
    
    this.log(`🎵 TTS 음성 생성 시작: ${take.id}`);
    this.log(`📝 텍스트 미리보기: "${take.text.substring(0, 50)}..."`);
    this.log(`🗣️ 선택된 음성: ${this.selectedVoice.name} (${this.selectedVoice.id})`);
    this.log(`🌍 언어: ${take.language}`);
    this.log(`📏 텍스트 길이: ${take.text.length}자`);
    
    // 멀티 청크 필요 여부 확인
    const isMultiChunk = this.needsMultiChunk(take.text, take.language);
    
    if (isMultiChunk) {
      this.log(`🔄 멀티청크 TTS 모드: ${take.text.length}자 → 분할 처리`);
      return await this.generateMultiChunkAudio(take);
    } else {
      this.log(`🎵 단일청크 TTS 모드: ${take.text.length}자 → 단일 처리`);
      return await this.generateSingleChunkAudio(take.text, this.selectedVoice, take.language);
    }
  }

  // 기존 단일 TTS 요청 처리 (호환성 유지)
  async convertToSpeechLegacy(take) {
    const requestData = {
      text: take.text,
      voice_id: this.selectedVoice.id,
      language: take.language,
      style: this.selectedVoice.id === '6151a25f6a7f5b1e000023' ? 'excited' : 'neutral',
      model: 'sona_speech_1',
      speed: this.playbackSpeed,
      voice_settings: {
        pitch_shift: 0,
        pitch_variance: 1,
        speed: this.playbackSpeed
      }
    };

    this.log('TTS API 요청:', requestData);
    this.log('API URL:', `${this.apiUrl}/api/tts`);

    try {
      const response = await fetch(`${this.apiUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
        signal: this.abortController?.signal
      });

      this.log('API 응답 상태:', response.status);
      this.log('API 응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        this.error('API 오류 응답:', errorText);
        throw new Error(`TTS API 오류: ${response.status} - ${errorText}`);
      }

      const audioData = await response.arrayBuffer();
      this.log('받은 오디오 데이터 크기:', audioData.byteLength, 'bytes');
      
      if (audioData.byteLength === 0) {
        throw new Error('빈 오디오 데이터를 받았습니다.');
      }

      const blob = new Blob([audioData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      this.log('생성된 오디오 URL:', url);
      
      return url;
    } catch (error) {
      this.error('TTS 변환 상세 오류:', error);
      
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
        this.log(`오디오 메타데이터 로드 완료 - 길이: ${this.currentAudio.duration}초`);
        this.startWordTracking(takeIndex);
      };
      
      this.currentAudio.onended = () => {
        this.isPlaying = false;
        this.log(`테이크 ${takeIndex} 재생 완료`);
        
        // 단어 트래킹 중지
        this.stopWordTracking();
        
        // 🎯 테이크 종료 후 0.5초 지연
        setTimeout(() => {
          // 다음 테이크 재생
          if (takeIndex + 1 < this.takes.length) {
            this.currentTakeIndex = takeIndex + 1;
            
            // 🎯 메모리 최적화: 캐시된 테이크는 즉시, 아니면 짧은 간격
            const nextCacheKey = `take_${this.currentTakeIndex}_${this.selectedVoice.id}`;
            const nextTakeBuffered = this.getFromAudioCache(nextCacheKey);
            const delay = nextTakeBuffered ? 50 : 200; // 캐시된 경우 50ms, 아니면 200ms
            
            this.log(`다음 테이크 ${this.currentTakeIndex + 1} ${nextTakeBuffered ? '버퍼링됨 (즉시)' : '생성 필요 (200ms 대기)'}`);
            
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
        }, 500); // 0.5초 지연
      };
      
      this.currentAudio.onerror = (error) => {
        this.error('오디오 재생 오류:', error);
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

    this.log(`=== 📍 새로운 단어 트래킹 시작 ===`);
    this.log(`테이크 ${takeIndex + 1}: "${take.text.substring(0, 50)}..."`);
    this.log(`테이크 요소 정보:`, take.elementInfo);

    // currentTakeIndex 동기화
    this.currentTakeIndex = takeIndex;

    // 🎯 테이크별 정확한 DOM 요소 사용
    const targetElement = take.elementInfo?.element;
    if (!targetElement) {
      this.error('테이크에 연결된 DOM 요소가 없음');
      return;
    }

    this.log(`트래킹 대상 요소: ${targetElement.tagName}.${targetElement.className} (${take.elementInfo.selector})`);

    // 🎯 해당 요소에서만 텍스트 추출 및 래핑
    this.wrapTakeWordsInSpecificElement(targetElement, take.text, takeIndex);

    // 현재 테이크의 텍스트만을 단어별로 분할
    this.currentTakeWords = take.text.split(/\s+/).filter(word => word.length > 0);
    this.currentTakeWordElements = [];
    
    this.log(`테이크 ${takeIndex + 1} 단어 트래킹 시작: ${this.currentTakeWords.length}개 단어`);
    
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
      this.log(`캐시된 컨테이너 재사용:`, this.cachedContainer.tagName, this.cachedContainer.className);
      return this.cachedContainer;
    }

    const originalElement = window.ttsSelector?.currentElement;
    if (!originalElement) return null;

    this.log(`새 컨테이너 탐색 시작. 원본 요소:`, originalElement.tagName, originalElement.className);

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
    
    this.log(`키워드 샘플들:`, keywordSamples.map(k => `"${k.substring(0, 30)}..."`));

    // 상위 요소들을 순회하면서 최적 컨테이너 찾기
    while (candidate && candidate !== document.body) {
      const candidateText = this.normalizeForMatching(candidate.textContent || '');
      
      // 모든 키워드 샘플 중 하나라도 포함되면 후보로 선정
      const hasKeywords = keywordSamples.some(sample => candidateText.includes(sample));
      
      if (hasKeywords && candidateText.length > maxTextLength) {
        bestContainer = candidate;
        maxTextLength = candidateText.length;
        this.log(`더 나은 컨테이너 발견:`, candidate.tagName, candidate.className, `길이: ${candidateText.length}`);
      }

      candidate = candidate.parentElement;
    }

    // 2단계: 너무 큰 요소는 피하고 적절한 범위로 제한
    const containerText = this.normalizeForMatching(bestContainer.textContent || '');
    
    if (containerText.length > normalizedAllText.length * 3) {
      this.log(`컨테이너가 너무 큼 (${containerText.length} vs ${normalizedAllText.length}). 하위 요소 탐색`);
      
      // 하위 요소 중에서 키워드를 포함하는 가장 작은 요소 찾기
      const children = Array.from(bestContainer.children);
      for (let child of children) {
        const childText = this.normalizeForMatching(child.textContent || '');
        const childHasKeywords = keywordSamples.some(sample => childText.includes(sample));
        
        if (childHasKeywords && childText.length < containerText.length) {
          this.log(`더 적절한 하위 컨테이너:`, child.tagName, child.className);
          bestContainer = child;
          break;
        }
      }
    }

    // 컨테이너 캐시
    this.cachedContainer = bestContainer;
    this.log(`최종 선택 및 캐시된 컨테이너:`, bestContainer.tagName, bestContainer.className);
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
    this.log(`=== 특정 요소 내 단어 래핑 시작 ===`);
    this.log(`대상 요소: ${targetElement.tagName}.${targetElement.className}`);
    this.log(`테이크 텍스트: "${takeText.substring(0, 50)}..."`);
    
    // 이전 래핑 해제 (현재 테이크만)
    this.unwrapWords();
    
    // 대상 요소 내의 모든 텍스트 추출
    const elementText = this.extractAllTextFromElement(targetElement);
    const normalizedElementText = this.normalizeForMatching(elementText);
    const normalizedTakeText = this.normalizeForMatching(takeText);
    
    this.log(`요소 텍스트 길이: ${elementText.length}자`);
    this.log(`테이크 텍스트 길이: ${takeText.length}자`);
    
    // 테이크 텍스트가 요소 내에 있는지 확인
    const takeStartIndex = normalizedElementText.indexOf(normalizedTakeText.substring(0, Math.min(100, normalizedTakeText.length)));
    
    if (takeStartIndex === -1) {
      this.warn('요소 내에서 테이크 텍스트를 찾을 수 없음');
      return;
    }
    
    this.log(`테이크 시작 위치: ${takeStartIndex}`);
    
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
    
    this.log(`텍스트 노드 ${textNodes.length}개 발견`);
    
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
        this.log(`노드 래핑: "${nodeText.substring(0, 30)}..."`);
        this.wrapSingleTextNode(textNode);
      }
      
      currentIndex = nodeEndIndex + 1; // 공백 고려
    }
    
    this.log(`테이크 ${takeIndex + 1} 래핑 완료: ${this.currentTakeWordElements.length}개 단어`);
  }

  // 현재 테이크 텍스트와 일치하는 부분만 래핑 (정확한 범위로 제한) - 기존 로직
  wrapCurrentTakeWords(element, takeText) {
    this.log(`=== 테이크 ${this.currentTakeIndex + 1} 텍스트 래핑 시작 ===`);
    this.log(`테이크 텍스트: ${takeText.substring(0, 50)}...`);
    this.log(`테이크 길이: ${takeText.length}자`);
    
    // 이전 래핑 해제
    const beforeUnwrap = document.querySelectorAll('.tts-word, .tts-current-take').length;
    this.log(`래핑 해제 전 span 개수: ${beforeUnwrap}`);
    
    this.unwrapWords();
    
    const afterUnwrap = document.querySelectorAll('.tts-word, .tts-current-take').length;
    this.log(`래핑 해제 후 span 개수: ${afterUnwrap}`);
    
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
    
    this.log(`원본 전체 텍스트 길이: ${originalFullText.length}`);
    this.log(`현재 테이크 오프셋: ${takeStartOffset} - ${takeEndOffset}`);
    this.log(`현재 테이크 원본 텍스트: "${originalFullText.substring(takeStartOffset, takeEndOffset)}"`);
    
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
    
    this.log(`정규화된 DOM 텍스트 길이: ${normalizedDomText.length}`);
    this.log(`정규화된 원본 텍스트 길이: ${normalizedOriginalText.length}`);
    this.log(`DOM 텍스트 샘플: "${normalizedDomText.substring(0, 80)}..."`);
    this.log(`원본 텍스트 샘플: "${normalizedOriginalText.substring(0, 80)}..."`);
    
    // 🎯 직접 현재 테이크 매칭 (이전 테이크 건너뛰기)
    this.log(`현재 테이크 ${this.currentTakeIndex + 1} 직접 매칭 시작`);
    
    // 현재 테이크의 처음 5개 단어 추출 (정규화된 텍스트에서)
    const currentTakeWords = normalizedTakeText.split(/\s+/).filter(w => w.length > 0);
    const keyWords = currentTakeWords.slice(0, Math.min(5, currentTakeWords.length)).join(' ');
    
    this.log(`정규화된 테이크 텍스트: "${normalizedTakeText.substring(0, 100)}..."`);
    this.log(`키워드 (처음 5단어): "${keyWords}"`);
    
    // 🚀 개선: 이전에 찾은 위치부터 시작 (캐시 활용)
    let searchStartPos = 0;
    
    if (this.currentTakeIndex > 0 && this.lastTakeEndPosition !== undefined) {
      // 이전 테이크가 끝난 위치부터 검색 시작
      searchStartPos = this.lastTakeEndPosition;
      this.log(`이전 테이크 끝 위치부터 검색 시작: ${searchStartPos}`);
    } else {
      this.log(`첫 번째 테이크, 처음부터 검색`);
    }
    
    // 현재 테이크 키워드를 바로 찾기
    let takeStartIndex = normalizedDomText.indexOf(keyWords, searchStartPos);
    
    if (takeStartIndex === -1) {
      this.warn('키워드 매칭 실패. 전체 범위에서 재검색');
      
      // 3단계: 전체 텍스트에서 키워드의 모든 위치 찾기
      const allKeywordMatches = [];
      let pos = 0;
      while ((pos = normalizedDomText.indexOf(keyWords, pos)) !== -1) {
        allKeywordMatches.push(pos);
        pos += keyWords.length;
      }
      
      this.log(`키워드 "${keyWords}" 모든 매칭:`, allKeywordMatches);
      
      if (allKeywordMatches.length > this.currentTakeIndex) {
        takeStartIndex = allKeywordMatches[this.currentTakeIndex];
        this.log(`${this.currentTakeIndex}번째 키워드 매칭 사용: ${takeStartIndex}`);
      } else if (allKeywordMatches.length > 0) {
        // 키워드 매칭이 적으면 마지막 매칭 이후 위치 추정
        const lastMatch = allKeywordMatches[allKeywordMatches.length - 1];
        takeStartIndex = lastMatch + (this.currentTakeIndex - allKeywordMatches.length + 1) * 200; // 대략적 추정
        this.log(`추정 위치 사용: ${takeStartIndex}`);
      }
    }
    
    if (takeStartIndex === -1 || takeStartIndex >= normalizedDomText.length) {
      this.warn('키워드 매칭 완전 실패. 단어별 매칭 시도');
      
      // 4단계: 첫 번째 단어만으로 매칭
      const firstWord = currentTakeWords[0];
      if (firstWord && firstWord.length > 2) {
        takeStartIndex = normalizedDomText.indexOf(firstWord, Math.max(0, estimatedStartPos - 100));
        this.log(`첫 단어 "${firstWord}" 매칭 시도: ${takeStartIndex}`);
      }
      
      if (takeStartIndex === -1) {
        this.error('모든 매칭 방법 실패. 테이크 건너뛰기');
        this.log(`찾으려던 텍스트: "${normalizedTakeText.substring(0, 100)}..."`);
        this.log(`DOM 텍스트 샘플: "${normalizedDomText.substring(Math.max(0, estimatedStartPos - 50), estimatedStartPos + 150)}..."`);
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
    
    this.log(`테이크 시작: ${takeStartIndex}, 끝: ${takeEndIndex}, 길이: ${safeTakeLength}`);
    
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
        this.log(`다음 테이크로 인한 조정: ${takeEndIndex}`);
      }
    }
    
    // 매칭된 영역 확인
    const actualMatchedText = normalizedDomText.substring(takeStartIndex, takeEndIndex);
    this.log(`✅ 키워드 매칭 성공! 위치: ${takeStartIndex} - ${takeEndIndex}`);
    this.log(`키워드: "${keyWords}"`);
    this.log(`매칭 영역 (앞 50자): "${actualMatchedText.substring(0, 50)}..."`);
    
    // 키워드 기반 매칭이므로 엄격한 유사도 검사 생략
    const keywordMatch = actualMatchedText.includes(keyWords);
    if (!keywordMatch) {
      this.warn('키워드가 매칭 영역에 포함되지 않음');
      // 그래도 계속 진행 (위치 추정이 정확하지 않을 수 있음)
    }
    
    this.log(`실제 테이크 길이: ${normalizedTakeText.length}, 매칭 영역 길이: ${actualMatchedText.length}`);
    
    // 길이 차이가 너무 크면 조정
    if (Math.abs(actualMatchedText.length - normalizedTakeText.length) > normalizedTakeText.length * 0.5) {
      this.log('길이 차이가 큼. 원래 테이크 길이로 조정');
      takeEndIndex = takeStartIndex + normalizedTakeText.length;
      if (takeEndIndex > normalizedDomText.length) {
        takeEndIndex = normalizedDomText.length;
      }
    }

    // 🎯 테이크 끝 위치 캐시 (다음 테이크에서 사용)
    this.lastTakeEndPosition = takeEndIndex;
    this.log(`테이크 ${this.currentTakeIndex + 1} 끝 위치 캐시: ${takeEndIndex}`);

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
      this.log(`텍스트 노드 래핑 완료: ${words.filter(w => w.trim().length > 0).length}개 단어`);
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
          this.log('스크롤 실패:', e);
        }
        
        // 🎯 UI 업데이트 - 현재 단어 정보
        const currentWord = this.currentTakeWords[wordIndex] || '';
        this.updateWordInfo(wordIndex + 1, this.currentTakeWords.length, currentWord);
      }
    }
    
    // 디버깅 정보 (현재 테이크 기준)
    if (wordIndex % 5 === 0) { // 5번째 단어마다 로그
      this.log(`현재 테이크 단어 트래킹: ${wordIndex}/${this.currentTakeWordElements.length} (${Math.round(progress * 100)}%)`);
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
    this.log(`unwrapWords 호출됨 - 테이크 ${this.currentTakeIndex}`);
    
    // 🎯 현재 테이크 전용 클래스로 정확한 해제
    const currentTakeSelector = `.tts-take-${this.currentTakeIndex}, .tts-current-take`;
    const wrappedWords = document.querySelectorAll(currentTakeSelector);
    this.log(`현재 테이크 래핑된 span 개수: ${wrappedWords.length}`);
    
    wrappedWords.forEach((span, index) => {
      const parent = span.parentNode;
      if (parent) {
        this.log(`테이크 ${this.currentTakeIndex} span ${index + 1} 해제: "${span.textContent}"`);
        parent.replaceChild(document.createTextNode(span.textContent), span);
        parent.normalize(); // 인접한 텍스트 노드들을 합치기
      }
    });
    
    // 배열 초기화
    this.currentTakeWordElements = [];
    this.currentTakeWords = [];
    
    // 해제 후 다시 확인 (현재 테이크만)
    const remainingCurrentSpans = document.querySelectorAll(currentTakeSelector);
    this.log(`현재 테이크 해제 후 남은 span 개수: ${remainingCurrentSpans.length}`);
    
    if (remainingCurrentSpans.length > 0) {
      this.warn(`경고: 현재 테이크의 span이 ${remainingCurrentSpans.length}개 남아있습니다.`);
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
    this.log(`전체 TTS span 개수: ${allTTSSpans.length}`);
  }

  // 🎯 메모리 최적화: 다음 테이크 미리 생성 (새로운 캐시 시스템)
  async prepareNextTake(takeIndex) {
    const cacheKey = `take_${takeIndex}_${this.selectedVoice.id}`;
    
    if (takeIndex >= this.takes.length || this.getFromAudioCache(cacheKey)) {
      return; // 이미 생성됨 또는 범위 초과
    }
    
    try {
      const take = this.takes[takeIndex];
      this.log(`테이크 ${takeIndex} 미리 생성 중...`);
      
      const audioUrl = await this.convertToSpeech(take);
      this.addToAudioCache(cacheKey, audioUrl);
      
      this.log(`테이크 ${takeIndex} 미리 생성 완료`);
    } catch (error) {
      this.error(`테이크 ${takeIndex} 미리 생성 실패:`, error);
    }
  }

  // 모든 재생 중지 및 초기화
  stopAll() {
    this.log('TTS 모든 재생 중지');
    
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
    
    // Zeta AI 자동 발화 오디오 중지
    if (this.zetaAIAudio) {
      this.zetaAIAudio.pause();
      this.zetaAIAudio.currentTime = 0;
      this.zetaAIAudio = null;
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
    // 🎯 메모리 최적화: 새로운 캐시 시스템으로 오디오 URL 해제
    for (const [key, url] of this.audioBuffer.entries()) {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }
    this.audioBuffer.clear();
    this.audioBufferTTL.clear();
    this.takes = [];
    
    // 🎯 메모리 최적화: 캐시 정리 타이머도 정리
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    
    // 🤖 Zeta AI 모니터링 중지
    this.stopZetaAIMonitoring();
    
    // UI 업데이트
    this.updateStatus('중지됨', '#FF5722');
    this.updateProgress(0);
    
    setTimeout(() => this.hideUI(), 2000);
  }


}

// TTS Manager 전역 인스턴스 생성
window.ttsManager = new TTSManager();

console.log('TTS 모듈 로드 완료');
