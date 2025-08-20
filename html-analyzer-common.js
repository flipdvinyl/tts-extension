/**
 * HTML 분석 공통 로직
 * 모든 사이트에서 공통으로 사용되는 HTML 분석 및 제외 로직
 */

class HTMLAnalyzerCommon {
  constructor() {
    this.DEBUG_MODE = false;
  }

  // 🎯 조건부 로깅 헬퍼 메소드들
  log(...args) {
    if (this.DEBUG_MODE) console.log(...args);
  }

  warn(...args) {
    if (this.DEBUG_MODE) console.warn(...args);
  }

  error(...args) {
    if (this.DEBUG_MODE) console.error(...args);
  }

  // 🎯 body 내부 메인 콘텐츠 추출 (header, footer 제외)
  extractMainContent() {
    const body = document.body;
    if (!body) return null;
    
    const hostname = window.location.hostname.toLowerCase();
    console.log(`🌐 사이트별 메인 콘텐츠 추출 시작: ${hostname}`);
    
    // 🎯 사이트별 특화 본문 영역 식별 (사이트별 로직에서 처리)
    let mainContent = null;
    
    // 🎯 사이트별 특화 로직 우선 적용
    if (window.htmlAnalyzerSites && window.htmlAnalyzerSites.getSiteSpecificMainContent) {
      mainContent = window.htmlAnalyzerSites.getSiteSpecificMainContent(hostname, body);
      if (mainContent) {
        console.log(`✅ 사이트별 특화 로직으로 본문 영역 발견: ${hostname}`);
        return mainContent;
      }
    }
    
    if (!mainContent) {
      // 일반적인 메인 콘텐츠 영역 찾기
      mainContent = body.querySelector('main, [role="main"], .main, .content, .container, .board_view, .article, .post, .view_content, .content_view');
    }
    
    if (!mainContent) {
      // CNN/BBC/Google 등 대형 사이트 특화 셀렉터
      mainContent = body.querySelector('[data-module="ArticleBody"], .article-body, .story-body, .entry-content, .post-body, .article-content, .page-content, .main-content, [class*="article"], [class*="story"], [class*="page-"]');
    }
    
    if (!mainContent) {
      // 클리앙 및 기타 사이트: 게시글 본문 영역 탐지
      mainContent = body.querySelector('.view_content, .content_view, .board_content, .post_content, [class*="content"], [class*="view"]');
    }
    
    if (!mainContent) {
      // 메인 영역이 없으면 body 전체에서 제외 요소들 필터링
      mainContent = body;
      console.log('⚠️ 메인 콘텐츠 영역을 찾지 못해 body 전체를 사용합니다.');
    }
    
    console.log(`🎯 메인 콘텐츠 영역: <${mainContent.tagName.toLowerCase()}> (${hostname})`);
    if (mainContent.className) {
      console.log(`🏷️ 메인 콘텐츠 클래스: ${mainContent.className}`);
    }
    return mainContent;
  }
  
  // 🎯 콘텐츠 요소들 찾기 (DOM 순서대로 순차적 처리)
  findContentElements(container) {
    if (!container) return [];
    
    const contentElements = [];
    const processedElements = new Set(); // 중복 방지
    
    // TreeWalker로 DOM 순서대로 모든 블록 요소 탐색
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          // div, p, h#, article, section 등 블록 요소만
          const validTags = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'article', 'section', 'blockquote', 'aside'];
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
      
      // 🔍 클리앙 디버깅: p 태그 상세 분석
      if (tagName === 'p') {
        console.log(`🟢 P 태그 상세:`, {
          innerHTML: currentNode.innerHTML,
          textContent: `"${currentNode.textContent}"`,
          textLength: currentNode.textContent?.length || 0,
          hasOnlyBr: currentNode.innerHTML === '<br>' || currentNode.innerHTML === '<br/>',
          hasNbsp: currentNode.innerHTML.includes('&nbsp;')
        });
      }
      
      // 🎯 모든 태그를 DOM 순서대로 동일하게 처리
      const directText = this.getDirectTextContent(currentNode);
      const fullText = this.extractAllTextFromElement(currentNode);
      const isHeading = tagName.match(/^h[1-6]$/);
      const isParagraph = tagName === 'p';
      const minLength = isHeading ? 2 : 3; // p태그 3자, h태그 2자 (한글 기준)
      
      if (isParagraph || isHeading) {
        // p 태그나 헤딩 태그는 항상 개별 처리 (전체 텍스트 사용)
        if (fullText && fullText.length > minLength) {
          const elementType = isHeading ? 'H' : 'P';
          console.log(`✅ ${elementType} 태그 테이크 추가: "${fullText.substring(0, 30)}..."`);
          contentElements.push(currentNode);
          processedElements.add(currentNode);
        } else if (isParagraph) {
          // p 태그 디버깅: 왜 추가되지 않았는지 로그
          console.log(`❌ P 태그 제외됨:`, {
            fullTextLength: fullText?.length || 0,
            minLength: minLength,
            fullText: `"${fullText}"`,
            reason: !fullText ? '텍스트 없음' : fullText.length <= minLength ? '길이 부족' : '기타'
          });
        } else if (isHeading) {
          // 헤딩 태그 디버깅: 왜 추가되지 않았는지 로그
          console.log(`❌ H 태그 제외됨:`, {
            tagName: tagName,
            fullTextLength: fullText?.length || 0,
            minLength: minLength,
            fullText: `"${fullText}"`,
            className: currentNode.className || '없음',
            id: currentNode.id || '없음',
            reason: !fullText ? '텍스트 없음' : fullText.length <= minLength ? '길이 부족' : '기타'
          });
        }
      } else if (directText && directText.length > 3) { // div도 3자로 완화 (한글 기준)
        // div 등에서 직접 텍스트가 있는 경우 (직접 텍스트만 사용)
        console.log(`✅ 직접 텍스트 테이크 추가: <${tagName}> "${directText.substring(0, 30)}..."`);
        contentElements.push(currentNode);
        processedElements.add(currentNode);
        
        // ⚠️ 중요: 하위 요소들은 별도로 처리되도록 processedElements에 추가하지 않음
        // 각각이 독립적인 테이크가 될 수 있도록 함
      } else if (tagName === 'div' && !directText) {
        // 🎯 div 태그에 직접 텍스트가 없을 때 하위 p 태그들을 개별 처리
        console.log(`🔍 div 태그 하위 p 태그 검색: <${tagName}> class="${currentNode.className || '없음'}"`);
        
        const pElements = currentNode.querySelectorAll('p');
        console.log(`📝 div 내부 p 태그 ${pElements.length}개 발견`);
        
        pElements.forEach((pElement, index) => {
          // 이미 처리된 p 태그는 건너뛰기
          if (processedElements.has(pElement)) {
            console.log(`⏭️ 이미 처리된 p 태그 건너뛰기: ${index + 1}번째`);
            return;
          }
          
          const pText = pElement.textContent?.trim() || '';
          if (pText && pText.length > 3) { // p 태그는 3자 이상
            console.log(`✅ div 하위 p 태그 테이크 추가: "${pText.substring(0, 30)}..."`);
            contentElements.push(pElement);
            processedElements.add(pElement);
          } else {
            console.log(`❌ div 하위 p 태그 제외: 길이 ${pText.length}자 "${pText}"`);
          }
        });
      }
    }
    
    console.log(`🔍 콘텐츠 요소 탐색 완료: ${contentElements.length}개`);
    
    // 🔍 대형 사이트 디버깅: 발견된 요소들 요약
    const hostname = window.location.hostname;
    const isProblematicSite = hostname.includes('cnn.com') || hostname.includes('bbc.com') || hostname.includes('google.com') || hostname.includes('clien.net');
    
    if (isProblematicSite || contentElements.length === 0) {
      console.log(`🔍 ${hostname} 디버깅 - 발견된 콘텐츠 요소들:`);
      contentElements.slice(0, 5).forEach((el, idx) => {
        const text = el.textContent?.trim().substring(0, 50) || '';
        console.log(`  ${idx + 1}. <${el.tagName.toLowerCase()}> "${text}..."`);
        console.log(`    클래스: ${el.className || '없음'}`);
        console.log(`    ID: ${el.id || '없음'}`);
      });
      if (contentElements.length === 0) {
        console.log(`⚠️ ${hostname}에서 콘텐츠 요소를 하나도 찾지 못했습니다!`);
        console.log(`📊 메인 콘텐츠 영역: ${container?.tagName || '없음'}`);
        console.log(`📊 메인 콘텐츠 클래스: ${container?.className || '없음'}`);
      }
    }
    
    return contentElements;
  }
  
  // 🎯 요소 제외 여부 판단 (Daum 뉴스 디버깅 강화)
  shouldExcludeElement(element) {
    const isExcluded = this.isExcludedElement(element);
    const isVisible = this.isVisibleElement(element);
    const textContent = element.textContent?.trim() || '';
    
    // 🔍 Daum 뉴스 디버깅: 제외 사유 상세 분석
    if (isExcluded || !isVisible) {
      console.log(`🚫 요소 제외됨:`, {
        tagName: element.tagName.toLowerCase(),
        className: element.className || '',
        id: element.id || '',
        isExcluded: isExcluded,
        isVisible: isVisible,
        textLength: textContent.length,
        textPreview: textContent.substring(0, 50) + '...'
      });
    }
    
    return isExcluded || !isVisible;
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

  // 🔍 제외할 요소 판단 (버튼, 메타데이터, 접근성 텍스트 등)
  isExcludedElement(element) {
    const hostname = window.location.hostname.toLowerCase();
    const className = (element.className || '').toLowerCase();
    const elementId = (element.id || '').toLowerCase();
    
    // 🎯 사이트별 특화 제외 로직 (사이트별 로직에서 처리)
    if (window.htmlAnalyzerSites && window.htmlAnalyzerSites.isSiteSpecificExcludedElement(hostname, element, className, elementId)) {
      return true;
    }
    
    // 1. 태그 기반 제외 (스크립트, 스타일, 폼 요소 등)
    const excludedTags = [
      'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'BUTTON', 'INPUT', 
      'SELECT', 'TEXTAREA', 'FORM', 'LABEL', 'FIELDSET', 'LEGEND'
    ];
    
    if (excludedTags.includes(element.tagName)) {
      return true;
    }

    // 2. Role 기반 제외 (대형 사이트 호환성을 위해 최소화)
    const excludedRoles = [
      'button', 'menu', 'menubar', 'menuitem', 'toolbar', 'navigation', 
      'banner', 'contentinfo', 'form', 'search', 'dialog', 'alertdialog'
      // 'complementary', 'tab', 'tabpanel', 'alert', 'status' 제거 (너무 광범위)
    ];
    
    const role = element.getAttribute('role');
    if (role && excludedRoles.includes(role.toLowerCase())) {
      return true;
    }

    // 3. 클래스명 기반 제외 (클리앙 호환성을 위해 매우 관대하게)
    const excludedClasses = [
      // 광고 관련 (정확한 매칭만)
      'advertisement', 'ad-banner', 'ad-container', 'sponsored-content',
      // 명확한 네비게이션만 제외 (navigation은 너무 광범위)
      'navbar', 'header-nav', 'footer-nav', 'sidebar-nav',
      // 명확한 버튼만 제외
      'button-container', 'btn-container',
      // 숨김 요소만 제외
      'screen-reader-only', 'sr-only', 'visually-hidden', 'hidden',
      // 팝업/모달만 제외
      'popup-overlay', 'modal-backdrop', 'overlay'
    ];
    
    // 🎯 버튼 관련 div 및 하위 요소 제외 (클리앙 호환성 고려)
    if (className.includes('btn') && (className.includes('button') || className.includes('click'))) {
      console.log(`🚫 버튼 div 제외: <${element.tagName.toLowerCase()}> class="${element.className}"`);
      return true;
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
    
    // 🔍 Daum 뉴스 디버깅: 클래스 기반 제외 상세 분석
    const matchedClass = excludedClasses.find(cls => className.includes(cls));
    if (matchedClass) {
      console.log(`🚫 클래스 제외: "${matchedClass}" in "${className}" - 요소: <${element.tagName.toLowerCase()}>`);
      console.log(`📝 요소 텍스트: "${element.textContent?.substring(0, 50)}..."`);
      return true;
    }

    // 4. ID 기반 제외
    const excludedIds = [
      'ad', 'advertisement', 'banner', 'header', 'footer', 'nav',
      'menu', 'sidebar', 'poll', 'newsletter', 'feedback'
    ];

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
    if (textContent.length > 0 && textContent.length < 3) {
      // 2글자 이하의 아주 짧은 텍스트만 버튼으로 간주 (한글 호환성)
      const shortButtonTexts = ['ok', 'no'];
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

  // 🆕 선택된 요소의 모든 텍스트 추출 (DOM 탐색에서 이미 검증된 요소용)
  extractAllTextFromElement(element) {
    if (!element) return '';

    // p, h 태그 등 이미 검증된 요소는 직접 textContent 사용
    const tagName = element.tagName.toLowerCase();
    if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
      const text = element.textContent?.trim() || '';
      console.log(`📝 ${tagName.toUpperCase()} 태그 직접 추출: "${text}" (${text.length}자)`);
      return text;
    }

    // 다른 요소들은 기존 로직 사용
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
    const hostname = window.location.hostname.toLowerCase();
    
    // 🎯 사이트별 특화 본문 텍스트 판단 (사이트별 로직에서 처리)
    if (window.htmlAnalyzerSites) {
      const siteSpecificResult = window.htmlAnalyzerSites.isSiteSpecificMainContent(hostname, element, text);
      if (siteSpecificResult !== null) {
        return siteSpecificResult;
      }
    }
    
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
    
    // 3차: 길이 기반 필터링
    if (textLength < 3) {
      return false; // 너무 짧은 텍스트 제외
    }
    
    // 4차: 의미 있는 콘텐츠로 판단
    return true;
  }

  // 🎯 중요한 콘텐츠 요소 판단
  isImportantContent(element, text) {
    const tagName = element.tagName.toLowerCase();
    const className = (element.className || '').toLowerCase();
    const elementId = (element.id || '').toLowerCase();
    
    // 1. 제목 태그는 항상 중요
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
      return true;
    }
    
    // 2. 문단 태그는 기본적으로 중요
    if (tagName === 'p') {
      return true;
    }
    
    // 3. 본문 관련 클래스가 있는 요소
    const contentClasses = [
      'content', 'text', 'body', 'main', 'article', 'post', 'story',
      'paragraph', 'section', 'block', 'entry', 'description'
    ];
    
    if (contentClasses.some(cls => className.includes(cls) || elementId.includes(cls))) {
      return true;
    }
    
    // 4. 긴 텍스트는 본문일 가능성 높음
    if (text.length >= 50) {
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
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return false;
    }
    
    return true;
  }
}

// 전역 인스턴스 생성
window.htmlAnalyzerCommon = new HTMLAnalyzerCommon();

console.log('HTML 분석 공통 모듈 로드 완료');
