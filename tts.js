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

    // TTS 상태 관리
    this.currentAudio = null;
    this.audioBuffer = {};
    this.takes = [];
    this.currentTakeIndex = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.isGenerating = false;
    this.abortController = null;
    
    // 현재 선택된 음성
    this.selectedVoice = this.VOICES[2]; // 기본값: 책뚫남
    
    // API URL
    this.apiUrl = 'https://quiet-ink-groq.vercel.app';
    
    // 플로팅 UI 요소들
    this.floatingUI = null;
    this.statusLabel = null;
    
    this.init();
  }

  init() {
    this.createFloatingUI();
    this.setupKeyboardShortcuts();
    console.log('TTS Manager 초기화 완료');
  }

  // 플로팅 UI 생성
  createFloatingUI() {
    // 플로팅 컨테이너 생성
    this.floatingUI = document.createElement('div');
    this.floatingUI.id = 'tts-floating-ui';
    this.floatingUI.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      border-radius: 10px;
      padding: 15px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      z-index: 10001;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      display: none;
    `;

    // 상태 라벨
    this.statusLabel = document.createElement('div');
    this.statusLabel.id = 'tts-status';
    this.statusLabel.style.cssText = `
      margin-bottom: 10px;
      font-weight: bold;
      color: #4CAF50;
    `;
    this.statusLabel.textContent = 'TTS 준비됨';

    // 현재 음성 표시
    const voiceLabel = document.createElement('div');
    voiceLabel.id = 'tts-voice';
    voiceLabel.style.cssText = `
      margin-bottom: 10px;
      color: #2196F3;
    `;
    voiceLabel.textContent = `음성: ${this.selectedVoice.name}`;

    // 진행률 바
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
      margin-bottom: 10px;
      overflow: hidden;
    `;

    const progressBar = document.createElement('div');
    progressBar.id = 'tts-progress';
    progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background: #4CAF50;
      transition: width 0.3s ease;
    `;

    progressContainer.appendChild(progressBar);

    // 단축키 안내
    const shortcutInfo = document.createElement('div');
    shortcutInfo.style.cssText = `
      font-size: 10px;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.3;
    `;
    shortcutInfo.innerHTML = `
      <div>1~0: 음성 선택 | ESC: 중지</div>
      <div>현재: ${this.selectedVoice.key}번 - ${this.selectedVoice.name}</div>
    `;

    // 요소들 조립
    this.floatingUI.appendChild(this.statusLabel);
    this.floatingUI.appendChild(voiceLabel);
    this.floatingUI.appendChild(progressContainer);
    this.floatingUI.appendChild(shortcutInfo);

    document.body.appendChild(this.floatingUI);
  }

  // 키보드 단축키 설정
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // 입력 필드에서는 단축키 무시
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const key = event.key;

      // 1~0 숫자키로 음성 선택
      if (key >= '1' && key <= '9') {
        const voiceIndex = parseInt(key) - 1;
        if (voiceIndex < this.VOICES.length) {
          this.selectVoice(voiceIndex);
          event.preventDefault();
        }
      } else if (key === '0') {
        // 0번키는 마지막 음성 (릭 루빈)
        this.selectVoice(9);
        event.preventDefault();
      } else if (key === 'Escape') {
        // ESC로 모든 재생 중지
        this.stopAll();
        event.preventDefault();
      }
    });
  }

  // 음성 선택
  selectVoice(index) {
    if (index >= 0 && index < this.VOICES.length) {
      this.selectedVoice = this.VOICES[index];
      this.updateUI();
      console.log(`음성 선택: ${this.selectedVoice.name}`);
      
      // 선택된 텍스트가 있으면 TTS 시작
      if (window.ttsSelector && window.ttsSelector.selectedText) {
        this.startTTS(window.ttsSelector.selectedText);
      }
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
    const progressBar = document.getElementById('tts-progress');
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
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
  async startTTS(text) {
    if (!text || text.trim().length === 0) {
      console.log('텍스트가 없습니다.');
      return;
    }

    console.log('TTS 시작:', text.substring(0, 100) + '...');
    
    // 이전 재생 중지
    this.stopAll();
    
    // UI 표시
    this.showUI();
    this.updateStatus('텍스트 분석 중...', '#FF9800');
    
    try {
      // 텍스트를 테이크로 분할
      this.takes = await this.splitTextIntoTakes(text);
      console.log(`${this.takes.length}개 테이크로 분할됨`);
      
      // 첫 번째 테이크 생성 및 재생
      this.currentTakeIndex = 0;
      
      // 🚀 첫 번째 테이크와 동시에 백그라운드에서 다음 테이크들 생성
      const playFirstTake = this.generateAndPlayTake(0);
      
      // 백그라운드에서 다음 테이크들 미리 생성 (2-3개)
      const bufferedTakePromises = [];
      for (let i = 1; i < Math.min(this.takes.length, 4); i++) {
        bufferedTakePromises.push(this.prepareNextTake(i));
      }
      
      // 첫 번째 테이크 재생 완료까지 대기
      await playFirstTake;
      
      console.log(`백그라운드 버퍼링 진행 중: ${bufferedTakePromises.length}개 테이크`);
      
    } catch (error) {
      console.error('TTS 시작 실패:', error);
      this.updateStatus('TTS 실패', '#F44336');
      setTimeout(() => this.hideUI(), 3000);
    }
  }

  // 텍스트를 테이크로 분할 (App.js 로직 참고)
  async splitTextIntoTakes(text) {
    // 🎯 선택된 전체 영역의 텍스트 사용 (화면 밖 텍스트도 포함)
    const selectedElement = window.ttsSelector?.currentElement;
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
    
    // 첫 부분(500자 이하)으로 언어 감지
    const sampleText = targetText.substring(0, Math.min(500, targetText.length));
    const detectedLanguage = await this.detectLanguage(sampleText);
    
    // 영어인 경우 300자, 그 외는 200자
    const maxLength = detectedLanguage === 'en' ? 300 : 200;
    console.log(`언어 감지 결과: ${detectedLanguage}, 테이크 최대 길이: ${maxLength}자`);
    
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
      
      // 블록 내에서 테이크 분할
      while (remainingText.length > 0) {
        if (remainingText.length <= maxLength) {
          // 남은 텍스트가 최대 길이 이하면 하나의 테이크로
          takes.push({
            index: takeNumber - 1,
            text: remainingText,
            name: `Take ${takeNumber}`,
            language: detectedLanguage
          });
          takeNumber++;
          break;
        }
        
        // 최대 길이를 초과하는 경우 적절한 위치에서 분할
        let cutIndex = this.findBestCutPosition(remainingText, maxLength);
        
        const takeText = remainingText.slice(0, cutIndex).trim();
        if (takeText.length > 0) {
          takes.push({
            index: takeNumber - 1,
            text: takeText,
            name: `Take ${takeNumber}`,
            language: detectedLanguage
          });
          takeNumber++;
        }
        
        remainingText = remainingText.slice(cutIndex).trim();
      }
    }
    
    console.log(`최종 테이크 개수: ${takes.length}`);
    takes.forEach((take, index) => {
      console.log(`테이크 ${index + 1}: ${take.text.substring(0, 50)}... (${take.text.length}자)`);
    });
    
    return takes;
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

  // 🆕 선택된 요소의 모든 텍스트 추출 (가시성 무관, 광고 제외)
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
        
        // 광고나 불필요한 요소 필터링
        if (parentElement && !this.isExcludedElement(parentElement)) {
          allTexts.push(text);
        }
      }
    }

    return allTexts.join(' ');
  }

  // 🔍 제외할 요소 판단 (광고, 메뉴, 버튼 등)
  isExcludedElement(element) {
    const excludedTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME'];
    const excludedClasses = [
      'ad', 'advertisement', 'banner', 'promo', 'sponsored',
      'menu', 'nav', 'navigation', 'header', 'footer', 
      'sidebar', 'widget', 'button', 'btn', 'feedback'
    ];
    const excludedIds = ['ad', 'advertisement', 'banner', 'header', 'footer', 'nav'];

    // 태그명 확인
    if (excludedTags.includes(element.tagName)) {
      return true;
    }

    // 클래스명 확인
    const className = element.className.toLowerCase();
    if (excludedClasses.some(cls => className.includes(cls))) {
      return true;
    }

    // ID 확인
    const elementId = element.id.toLowerCase();
    if (excludedIds.some(id => elementId.includes(id))) {
      return true;
    }

    // 부모 요소까지 확인 (한 단계만)
    const parent = element.parentElement;
    if (parent) {
      const parentClass = parent.className.toLowerCase();
      const parentId = parent.id.toLowerCase();
      
      if (excludedClasses.some(cls => parentClass.includes(cls)) ||
          excludedIds.some(id => parentId.includes(id))) {
        return true;
      }
    }

    // CNN 특화: feedback, related article 등 제외
    if (className.includes('feedback') || className.includes('related') ||
        elementId.includes('feedback') || element.getAttribute('aria-label')?.includes('feedback')) {
      return true;
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
  async detectLanguage(text) {
    // 간단한 언어 감지 로직
    const koreanPattern = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    const englishPattern = /[a-zA-Z]/;
    
    const koreanCount = (text.match(koreanPattern) || []).length;
    const englishCount = (text.match(englishPattern) || []).length;
    
    if (koreanCount > englishCount) {
      return 'ko'; // kr -> ko로 변경
    } else if (englishCount > 0) {
      return 'en';
    } else {
      return 'ko'; // 기본값도 ko로 변경
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

    console.log(`=== 단어 트래킹 시작 ===`);
    console.log(`전달받은 takeIndex: ${takeIndex}`);
    console.log(`현재 this.currentTakeIndex: ${this.currentTakeIndex}`);
    console.log(`테이크 텍스트: "${take.text.substring(0, 50)}..."`);

    // currentTakeIndex 동기화 확인
    if (takeIndex !== this.currentTakeIndex) {
      console.warn(`takeIndex 불일치 감지! 전달받은: ${takeIndex}, 현재: ${this.currentTakeIndex}`);
      this.currentTakeIndex = takeIndex; // 강제 동기화
    }

    // 🎯 광역적 텍스트 범위 찾기
    const selectedElement = this.findBestContainerElement();
    if (!selectedElement) {
      console.error('적절한 컨테이너 요소를 찾을 수 없음');
      return;
    }

    console.log(`선택된 컨테이너 요소:`, selectedElement.tagName, selectedElement.className);

    // 현재 테이크의 텍스트만을 단어별로 분할
    this.currentTakeWords = take.text.split(/\s+/).filter(word => word.length > 0);
    this.currentTakeWordElements = [];
    
    console.log(`테이크 ${takeIndex + 1} 단어 트래킹 시작: ${this.currentTakeWords.length}개 단어`);
    
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

  // 현재 테이크 텍스트와 일치하는 부분만 래핑
  wrapCurrentTakeWords(element, takeText) {
    console.log(`=== 테이크 ${this.currentTakeIndex + 1} 텍스트 래핑 시작 ===`);
    console.log(`테이크 텍스트: ${takeText.substring(0, 50)}...`);
    
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

    // 키워드 매칭 성공 시 적절한 끝 위치 계산
    let takeEndIndex;
    
    // DOM에서 실제 테이크 텍스트 끝 위치 찾기
    const remainingDomText = normalizedDomText.substring(takeStartIndex);
    
    // 1. 현재 테이크 전체 길이로 시도
    if (takeStartIndex + normalizedTakeText.length <= normalizedDomText.length) {
      takeEndIndex = takeStartIndex + normalizedTakeText.length;
    } else {
      // 2. DOM 텍스트 끝까지 또는 다음 테이크 키워드까지
      if (this.currentTakeIndex + 1 < this.takes.length) {
        const nextTakeNormalized = this.normalizeForMatching(this.takes[this.currentTakeIndex + 1].text);
        const nextTakeWords = nextTakeNormalized.split(/\s+/).filter(w => w.length > 0);
        const nextKeyWords = nextTakeWords.slice(0, Math.min(3, nextTakeWords.length)).join(' ');
        
        const nextTakeStart = normalizedDomText.indexOf(nextKeyWords, takeStartIndex + keyWords.length);
        if (nextTakeStart !== -1) {
          takeEndIndex = nextTakeStart;
          console.log(`다음 테이크 키워드로 끝 위치 결정: ${takeEndIndex}`);
        } else {
          takeEndIndex = takeStartIndex + Math.min(normalizedTakeText.length, remainingDomText.length);
        }
      } else {
        takeEndIndex = normalizedDomText.length; // 마지막 테이크
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

  // 단일 텍스트 노드 래핑
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
          span.className = 'tts-word tts-current-take';
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
    
    // 이전 하이라이트 제거 (현재 테이크 단어들만)
    this.currentTakeWordElements.forEach(element => {
      if (element && element.style) {
        element.style.backgroundColor = '';
        element.style.color = '';
      }
    });
    
    // 현재 단어 하이라이트
    if (wordIndex >= 0 && wordIndex < this.currentTakeWordElements.length) {
      const currentWordElement = this.currentTakeWordElements[wordIndex];
      if (currentWordElement && currentWordElement.style) {
        currentWordElement.style.backgroundColor = 'rgba(255, 235, 59, 0.7)';
        currentWordElement.style.color = '#000';
        
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

  // 단어 래핑 해제
  unwrapWords() {
    console.log(`unwrapWords 호출됨`);
    
    // 현재 테이크 관련 클래스만 해제
    const wrappedWords = document.querySelectorAll('.tts-word, .tts-current-take');
    console.log(`찾은 래핑된 span 개수: ${wrappedWords.length}`);
    
    wrappedWords.forEach((span, index) => {
      const parent = span.parentNode;
      if (parent) {
        console.log(`span ${index + 1} 해제: "${span.textContent}"`);
        parent.replaceChild(document.createTextNode(span.textContent), span);
        parent.normalize(); // 인접한 텍스트 노드들을 합치기
      }
    });
    
    // 배열 초기화
    this.currentTakeWordElements = [];
    this.currentTakeWords = [];
    
    // 해제 후 다시 확인
    const remainingSpans = document.querySelectorAll('.tts-word, .tts-current-take');
    console.log(`해제 후 남은 span 개수: ${remainingSpans.length}`);
    
    if (remainingSpans.length > 0) {
      console.warn(`경고: 해제되지 않은 span이 ${remainingSpans.length}개 남아있습니다.`);
      // 강제로 남은 span들도 해제
      remainingSpans.forEach(span => {
        const parent = span.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(span.textContent), span);
          parent.normalize();
        }
      });
    }
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
