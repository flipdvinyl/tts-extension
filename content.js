class TTSSelector {
  constructor() {
    this.currentElement = null;
    this.selectedText = '';
    this.elementHistory = [];
    this.currentHistoryIndex = -1;
    this.isEnabled = true;
    
    // 마우스 위치 추적을 위한 변수들
    this.lastMousePosition = null;
    this.lastExpandElement = null;
    this.expandHistory = [];
    
    this.init();
  }

  init() {
    // 마우스 이벤트 리스너 추가
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
    // 키보드 이벤트 리스너 추가
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Chrome extension 메시지 리스너 추가
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    console.log('TTS Text Reader 초기화 완료');
  }

  handleMouseOver(event) {
    if (!this.isEnabled) return;
    
    const element = event.target;
    
    // 디버깅용 로그 (paragraph 클래스인 경우)
    if (element.className && element.className.includes('paragraph')) {
      console.log('paragraph 요소 마우스 오버:', {
        element: element.tagName + '.' + element.className,
        isValid: this.isValidTextElement(element),
        textLength: this.extractText(element).length,
        hasTextElement: this.findTextElement(element) !== null
      });
    }
    
    if (this.isValidTextElement(element)) {
      // 마우스 위치 저장
      this.lastMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
      this.selectElement(element);
    }
  }

  handleMouseOut(event) {
    if (!this.isEnabled) return;
    
    const element = event.target;
    if (element === this.currentElement) {
      this.clearSelection();
    }
  }

  handleMouseMove(event) {
    if (!this.isEnabled) return;
    
    // 마우스 위치 업데이트 (5px 이상 이동했을 때만)
    if (!this.lastMousePosition || 
        Math.abs(event.clientX - this.lastMousePosition.x) > 5 ||
        Math.abs(event.clientY - this.lastMousePosition.y) > 5) {
      this.lastMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    }
  }

  handleKeyDown(event) {
    if (!this.isEnabled) return;
    
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        this.expandSelection();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.shrinkSelection();
        break;
    }
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'toggle':
        if (this.isEnabled) {
          this.disable();
          console.log('TTS Text Reader 비활성화');
        } else {
          this.enable();
          console.log('TTS Text Reader 활성화');
        }
        sendResponse({ enabled: this.isEnabled });
        break;
        
      case 'getSelectedText':
        sendResponse({ text: this.selectedText });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  isValidTextElement(element) {
    // 읽을 필요 없는 요소들 제외
    const excludeTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK', 'INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'];
    const excludeClasses = ['ad', 'advertisement', 'banner', 'sidebar', 'nav', 'navigation', 'menu', 'footer', 'header'];
    
    if (excludeTags.includes(element.tagName)) return false;
    
    // 클래스명으로 제외할 요소들 체크
    const className = element.className || '';
    if (typeof className === 'string' && excludeClasses.some(cls => className.toLowerCase().includes(cls))) {
      return false;
    }
    
    // 모든 유효한 HTML 요소는 선택 가능 (텍스트 유무와 관계없이)
    return true;
  }

  extractText(element) {
    // 요소에서 텍스트만 추출 (HTML 태그 제거)
    const clone = element.cloneNode(true);
    
    // 🎯 불필요한 요소들 제거 (버튼 포함)
    const unwantedElements = clone.querySelectorAll(`
      script, style, noscript,
      button, input, select, textarea,
      [class*="btn"], [class*="button"],
      [role="button"], [role="link"], [role="tab"]
    `);
    unwantedElements.forEach(el => el.remove());
    
    // 텍스트 추출
    let text = clone.textContent || clone.innerText || '';
    
    // 불필요한 공백 정리
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  selectElement(element) {
    // 이전 선택 해제
    this.clearSelection();
    
    // 유효한 텍스트가 있는지 확인
    let text = this.extractText(element);
    
    // 디버깅용 로그 (paragraph 클래스인 경우)
    if (element.className && element.className.includes('paragraph')) {
      console.log('paragraph 요소 선택 시도:', {
        element: element.tagName + '.' + element.className,
        textLength: text.length,
        textPreview: text.substring(0, 50) + '...'
      });
    }
    
    // 텍스트가 없거나 너무 짧으면 하위 요소에서 텍스트 찾기
    if (!text || text.length < 10) {
      const textElement = this.findTextElement(element);
      if (textElement && textElement !== element) {
        console.log('하위 요소에서 텍스트 찾음:', textElement.tagName, textElement.className);
        element = textElement;
        text = this.extractText(element);
      }
    }
    
    // 텍스트가 있으면 선택 (길이 제한 없이)
    if (text && text.length > 0) {
      this.currentElement = element;
      this.selectedText = text;
      
      // 선택된 요소에 클래스 추가
      element.classList.add('tts-selected');
      
      // 히스토리에 추가
      this.addToHistory(element);
      
      console.log('선택된 텍스트:', text);
    }
  }

  findTextElement(element) {
    // 현재 요소가 텍스트를 가지고 있는지 확인
    const currentText = this.extractText(element);
    if (currentText && currentText.length >= 10) {
      return element;
    }
    
    // 하위 요소들 중에서 텍스트가 있는 요소 찾기
    const textElements = ['P', 'DIV', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'ARTICLE', 'SECTION'];
    for (let tagName of textElements) {
      const children = element.querySelectorAll(tagName);
      for (let child of children) {
        const childText = this.extractText(child);
        if (childText && childText.length >= 10) {
          return child;
        }
      }
    }
    
    return null;
  }

  clearSelection() {
    if (this.currentElement) {
      this.currentElement.classList.remove('tts-selected');
      this.currentElement = null;
      this.selectedText = '';
    }
  }

  expandSelection() {
    if (!this.currentElement) return;
    
    // 이전 확장 시점의 마우스 위치와 현재 위치 비교
    const isSamePosition = this.lastMousePosition && 
                          this.lastExpandElement && 
                          this.expandHistory.length > 0 &&
                          this.expandHistory[this.expandHistory.length - 1].mousePosition &&
                          Math.abs(this.lastMousePosition.x - this.expandHistory[this.expandHistory.length - 1].mousePosition.x) < 10 &&
                          Math.abs(this.lastMousePosition.y - this.expandHistory[this.expandHistory.length - 1].mousePosition.y) < 10;
    
    if (isSamePosition && this.lastExpandElement) {
      // 마우스 위치가 같다면: 이전 확장 요소보다 한단계 상위로 확장
      console.log('마우스 위치 동일 - 상위 요소로 확장');
      console.log('이전 확장 요소:', this.lastExpandElement.tagName, this.lastExpandElement.className);
      this.expandToParent(this.lastExpandElement);
    } else {
      // 마우스 위치가 다르거나 처음인 경우: 현재 선택된 최소단위에서 시작
      console.log('마우스 위치 변경 또는 처음 - 현재 요소에서 확장 시작');
      console.log('현재 요소:', this.currentElement.tagName, this.currentElement.className);
      this.expandFromCurrent();
    }
    
    // 확장 히스토리에 현재 상태 저장
    this.expandHistory.push({
      element: this.currentElement,
      mousePosition: { ...this.lastMousePosition }
    });
    
    // 히스토리 크기 제한 (최대 10개)
    if (this.expandHistory.length > 10) {
      this.expandHistory.shift();
    }
    
    // 현재 확장 요소 저장
    this.lastExpandElement = this.currentElement;
  }

  expandFromCurrent() {
    // 현재 선택된 요소에서 확장 시작
    let current = this.currentElement;
    let expanded = false;
    
    console.log('현재 요소에서 확장 시작:', current.tagName, current.className);
    
    // 1단계: 형제 요소들이 있으면 공통 부모로 확장
    const siblings = this.getSiblings(current);
    console.log('동위 요소 개수:', siblings.length);
    
    if (siblings.length > 0) {
      // 형제 요소가 있으면 공통 부모 찾기
      for (let sibling of siblings) {
        if (this.isValidTextElement(sibling)) {
          const siblingText = this.extractText(sibling);
          console.log('형제 요소 체크:', sibling.tagName, sibling.className, '텍스트 길이:', siblingText.length);
          
          if (siblingText.length > 0) {
            // 현재 요소와 형제 요소를 포함하는 부모 요소 찾기
            const commonParent = this.findCommonParent(current, sibling);
            if (commonParent && this.isValidTextElement(commonParent)) {
              console.log('✅ 공통 부모 찾음:', commonParent.tagName, commonParent.className);
              this.selectElement(commonParent);
              expanded = true;
              break;
            }
          }
        }
      }
    } else {
      console.log('형제 요소가 없습니다.');
    }
    
    // 2단계: 형제 요소가 없으면 상위 요소로 확장
    if (!expanded) {
      const parent = current.parentElement;
      if (parent && this.isValidTextElement(parent)) {
        const parentText = this.extractText(parent);
        console.log('상위 요소 확장 시도:', parent.tagName, parent.className, '텍스트 길이:', parentText.length);
        
        // 상위 요소로 확장 (텍스트 길이 제한 없이)
        this.selectElement(parent);
      } else {
        console.log('상위 요소가 없거나 유효하지 않습니다.');
      }
    }
  }

  expandToParent(element) {
    // 주어진 요소의 상위 요소로 확장
    const parent = element.parentElement;
    if (parent && this.isValidTextElement(parent)) {
      const parentText = this.extractText(parent);
      console.log('expandToParent 시도:', parent.tagName, parent.className, '텍스트 길이:', parentText.length);
      
      // 상위 요소로 확장 (텍스트 길이 제한 없이)
      console.log('상위 요소로 확장:', parent.tagName, parent.className);
      this.selectElement(parent);
    } else {
      console.log('상위 요소가 없거나 유효하지 않습니다.');
    }
  }

  findCommonParent(element1, element2) {
    let parent = element1.parentElement;
    while (parent) {
      if (parent.contains(element2)) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }

  shrinkSelection() {
    if (!this.currentElement || this.currentHistoryIndex <= 0) return;
    
    // 히스토리에서 이전 요소로 돌아가기
    this.currentHistoryIndex--;
    const previousElement = this.elementHistory[this.currentHistoryIndex];
    
    if (previousElement && this.isValidTextElement(previousElement)) {
      this.selectElement(previousElement);
    }
  }

  getSiblings(element) {
    const siblings = [];
    let sibling = element.previousElementSibling;
    
    // 이전 형제들
    while (sibling) {
      siblings.unshift(sibling);
      sibling = sibling.previousElementSibling;
    }
    
    // 다음 형제들
    sibling = element.nextElementSibling;
    while (sibling) {
      siblings.push(sibling);
      sibling = sibling.nextElementSibling;
    }
    
    return siblings;
  }

  addToHistory(element) {
    // 현재 인덱스 이후의 히스토리 제거
    this.elementHistory = this.elementHistory.slice(0, this.currentHistoryIndex + 1);
    
    // 새 요소 추가
    this.elementHistory.push(element);
    this.currentHistoryIndex = this.elementHistory.length - 1;
    
    // 히스토리 크기 제한 (최대 20개)
    if (this.elementHistory.length > 20) {
      this.elementHistory.shift();
      this.currentHistoryIndex--;
    }
  }

  // TTS 기능을 위한 메서드
  getSelectedText() {
    return this.selectedText;
  }

  // TTS 시작 (외부에서 호출 가능) - 메타데이터 포함
  startTTS() {
    if (this.selectedText && this.currentElement && window.ttsManager) {
      // 📍 DOM 요소 메타데이터 생성
      const elementMetadata = this.generateElementMetadata(this.currentElement);
      
      console.log('TTS 시작 - 요소 메타데이터:', elementMetadata);
      window.ttsManager.startTTS(this.selectedText, elementMetadata);
    } else {
      console.log('선택된 텍스트가 없거나 TTS Manager가 로드되지 않았습니다.');
    }
  }
  
  // 📍 DOM 요소 메타데이터 생성
  generateElementMetadata(element) {
    const metadata = {
      // 기본 요소 정보
      tagName: element.tagName.toLowerCase(),
      className: element.className || '',
      id: element.id || '',
      
      // CSS 선택자 (나중에 요소를 찾기 위함)
      selector: this.generateUniqueSelector(element),
      
      // 계층 구조 정보
      depth: this.getElementDepth(element),
      
      // 위치 정보
      boundingRect: element.getBoundingClientRect(),
      
      // 부모 요소 정보 (백업용)
      parentInfo: element.parentElement ? {
        tagName: element.parentElement.tagName.toLowerCase(),
        className: element.parentElement.className || '',
        id: element.parentElement.id || ''
      } : null,
      
      // DOM 참조 (직접 저장 - 주의: 메모리 누수 방지 필요)
      domElement: element
    };
    
    return metadata;
  }
  
  // 🎯 고유한 CSS 선택자 생성
  generateUniqueSelector(element) {
    const path = [];
    let current = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.tagName.toLowerCase();
      
      // ID가 있으면 사용 (가장 고유함)
      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break; // ID가 있으면 더 이상 올라가지 않음
      }
      
      // 클래스가 있으면 사용
      if (current.className) {
        const classes = current.className.trim().split(/\s+/);
        selector += '.' + classes.join('.');
      }
      
      // 형제 중 몇 번째인지 확인
      if (current.parentElement) {
        const siblings = Array.from(current.parentElement.children);
        const sameTagSiblings = siblings.filter(sibling => 
          sibling.tagName === current.tagName
        );
        
        if (sameTagSiblings.length > 1) {
          const index = sameTagSiblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
      
      // 너무 깊어지면 중단
      if (path.length > 8) break;
    }
    
    return path.join(' > ');
  }
  
  // 요소의 깊이 계산
  getElementDepth(element) {
    let depth = 0;
    let current = element;
    
    while (current.parentElement) {
      depth++;
      current = current.parentElement;
    }
    
    return depth;
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
    this.clearSelection();
  }
}

// 익스텐션 초기화
const ttsSelector = new TTSSelector();

// 전역 객체에 등록 (다른 스크립트에서 접근 가능하도록)
window.ttsSelector = ttsSelector;

// 디버깅용 전역 함수
window.ttsDebug = {
  status: () => {
    console.log('=== TTS Extension 상태 ===');
    console.log('현재 요소:', window.ttsSelector.currentElement ? 
      window.ttsSelector.currentElement.tagName + '.' + window.ttsSelector.currentElement.className : '없음');
    console.log('선택된 텍스트 길이:', window.ttsSelector.selectedText ? window.ttsSelector.selectedText.length : 0);
    console.log('마우스 위치:', window.ttsSelector.lastMousePosition);
    console.log('마지막 확장 요소:', window.ttsSelector.lastExpandElement ? 
      window.ttsSelector.lastExpandElement.tagName + '.' + window.ttsSelector.lastExpandElement.className : '없음');
    
    // 현재 요소의 형제 요소들 정보 출력
    if (window.ttsSelector.currentElement) {
      const siblings = window.ttsSelector.getSiblings(window.ttsSelector.currentElement);
      console.log('형제 요소들:', siblings.map(s => s.tagName + '.' + s.className));
      console.log('다음 형제:', window.ttsSelector.currentElement.nextElementSibling ? 
        window.ttsSelector.currentElement.nextElementSibling.tagName + '.' + window.ttsSelector.currentElement.nextElementSibling.className : '없음');
    }
  },
  
  testExpand: () => {
    console.log('=== 확장 테스트 ===');
    if (window.ttsSelector.currentElement) {
      window.ttsSelector.expandSelection();
    } else {
      console.log('선택된 요소가 없습니다.');
    }
  }
};
