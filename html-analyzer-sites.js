 /**
 * HTML 분석 사이트별 특화 로직
 * 특정 사이트(cnn, billboard, music business worldwide, naver, daum 등)에 대한 분석 및 제외 로직
 */

class HTMLAnalyzerSites {
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

  // 🎯 사이트별 특화 메인 콘텐츠 식별
  getSiteSpecificMainContent(hostname, body) {
    console.log(`🔍 사이트별 특화 로직 적용: ${hostname}`);
    
    // 네이버 뉴스 특화 로직
    if (hostname.includes('news.naver.com')) {
      console.log('📰 네이버 뉴스 사이트 감지');
      
      // 네이버 뉴스 본문 영역 검색 (class="newsct_article _article_body")
      const naverMainContainer = body.querySelector('.newsct_article._article_body');
      if (naverMainContainer) {
        console.log('✅ 네이버 뉴스 메인 컨테이너 발견: .newsct_article._article_body');
        return naverMainContainer;
      }
    }
    
    // YTN 특화 로직
    if (hostname.includes('ytn')) {
      console.log('📺 YTN 사이트 감지');
      
      // YTN 본문 영역 검색 (class="paragraph" 안에서만 본문 탐색)
      const ytnParagraphContainer = body.querySelector('.paragraph');
      if (ytnParagraphContainer) {
        console.log('✅ YTN 본문 영역 발견: .paragraph');
        return ytnParagraphContainer;
      }
    }
    
    // Billboard.com 특화 로직
    if (hostname.includes('billboard.com')) {
      console.log('🎵 Billboard 사이트 감지');
      
      // Billboard 기사 본문 영역들 시도
      const billboardSelectors = [
        '.pmc-paywall',           // 페이월 콘텐츠 영역
        '.article-body',          // 기사 본문
        '.story-body',            // 스토리 본문
        '.content-body',          // 콘텐츠 본문
        '[data-article-body]',    // 데이터 속성 기반
        '.entry-content',         // 엔트리 콘텐츠
        'article .text-content',  // 아티클 내 텍스트
        '.article-content'        // 아티클 콘텐츠
      ];
      
      for (const selector of billboardSelectors) {
        const element = body.querySelector(selector);
        if (element && element.textContent?.trim().length > 100) {
          console.log(`✅ Billboard 본문 영역 발견: ${selector}`);
          return element;
        }
      }
    }
    
    // Music Business Worldwide 특화 로직
    if (hostname.includes('musicbusinessworldwide.com')) {
      console.log('🎼 Music Business Worldwide 사이트 감지');
      
      const mbwSelectors = [
        '.mb-article__body',      // MBW 기사 본문 (실제 클래스)
        '.post-content',          // 포스트 콘텐츠
        '.entry-content',         // 엔트리 콘텐츠
        '.article-content',       // 아티클 콘텐츠
        '.content',               // 일반 콘텐츠
        'article .content',       // 아티클 내 콘텐츠
        '.mb-article',            // MBW 아티클 전체
        'article',                // 아티클 태그 자체 (제목 포함)
        '.entry-header',          // 엔트리 헤더
        '.post-header'            // 포스트 헤더
      ];
      
      for (const selector of mbwSelectors) {
        const element = body.querySelector(selector);
        if (element && element.textContent?.trim().length > 50) { // 제목 포함으로 길이 완화
          console.log(`✅ MBW 본문 영역 발견: ${selector}`);
          return element;
        }
      }
    }
    
    // 노션(Notion) 특화 로직
    if (hostname.includes('notion.so') || hostname.includes('notion.site')) {
      console.log('📝 노션 사이트 감지');
      
      // 노션 자동 리프레시 설정
      this.setupNotionAutoRefresh();
      
      // 노션 페이지 콘텐츠 영역 검색 (.notion-page-content)
      const notionPageContent = body.querySelector('.notion-page-content');
      if (notionPageContent) {
        console.log('✅ 노션 페이지 콘텐츠 영역 발견: .notion-page-content');
        return notionPageContent;
      }
      
      // 대체 선택자들도 시도
      const notionSelectors = [
        '.notion-page-content',    // 기본 페이지 콘텐츠
        '.notion-page-body',       // 페이지 본문
        '.notion-page',            // 페이지 전체
        '.notion-content',         // 콘텐츠 영역
        '[data-block-id]',         // 블록 ID가 있는 요소들
        '.notion-text-block',      // 텍스트 블록들
        '.notion-page-content-inner' // 내부 콘텐츠
      ];
      
      for (const selector of notionSelectors) {
        const element = body.querySelector(selector);
        if (element && element.textContent?.trim().length > 20) {
          console.log(`✅ 노션 콘텐츠 영역 발견: ${selector}`);
          return element;
        }
      }
    }
    
    // CNN 특화 로직
    if (hostname.includes('cnn.com')) {
      console.log('📺 CNN 사이트 감지');
      
      const cnnSelectors = [
        '.article__content',      // CNN 기사 콘텐츠
        '.zn-body__paragraph',    // CNN 문단
        '[data-module="ArticleBody"]', // 데이터 모듈
        '.pg-rail-tall__body',    // CNN 본문 영역
        '.l-container',           // 컨테이너
        'article .zn-body',       // 아티클 본문
        '.article-body',          // 아티클 바디
        'article',                // 아티클 태그 자체 (제목 포함)
        '.headline',              // 헤드라인
        '.article-headline',      // 아티클 헤드라인
        '.pg-headline'            // 페이지 헤드라인
      ];
      
      for (const selector of cnnSelectors) {
        const element = body.querySelector(selector);
        if (element && element.textContent?.trim().length > 50) { // 제목 포함으로 길이 완화
          console.log(`✅ CNN 본문 영역 발견: ${selector}`);
          return element;
        }
      }
    }
    
    // Zeta AI 특화 로직
    if (hostname.includes('zeta-ai')) {
      console.log('🤖 Zeta AI 사이트 감지');
      
      // Zeta AI는 <main id="contents"> 안의 글만 감지
      const mainContents = body.querySelector('main#contents');
      if (mainContents && mainContents.textContent?.trim().length > 50) {
        console.log('✅ Zeta AI <main id="contents"> 영역 발견');
        return mainContents;
      }
      
      // <main id="contents">를 찾지 못한 경우 경고
      console.log('⚠️ Zeta AI <main id="contents"> 영역을 찾을 수 없음');
      return null;
    }

    // ChatGPT 특화 로직
    if (hostname.includes('chatgpt_temp')) {
      console.log('🤖 ChatGPT 사이트 감지');
      
      // ChatGPT는 <div class="@thread*"> 안의 글만 감지
      const threadElements = body.querySelectorAll('div[class*="@thread"]');
      if (threadElements.length > 0) {
        console.log(`✅ ChatGPT @thread 클래스 요소 ${threadElements.length}개 발견`);
        
        // 첫 번째 @thread 요소 반환 (또는 모든 @thread 요소를 포함하는 컨테이너)
        const firstThreadElement = threadElements[0];
        if (firstThreadElement && firstThreadElement.textContent?.trim().length > 50) {
          console.log('✅ ChatGPT @thread 영역 발견');
          return firstThreadElement;
        }
      }
      
      // @thread 요소를 찾지 못한 경우 경고
      console.log('⚠️ ChatGPT @thread 영역을 찾을 수 없음');
      return null;
    }
    
    console.log(`⚠️ ${hostname}에 대한 특화 로직에서 본문을 찾지 못함`);
    return null;
  }

  // 📝 노션 자동 리프레시 설정
  setupNotionAutoRefresh() {
    // 이미 설정되어 있으면 중복 방지
    if (this.notionAutoRefreshSetup) {
      return;
    }
    
    this.notionAutoRefreshSetup = true;
    console.log('📝 노션 자동 리프레시 설정 시작');
    
    // 2초 후 첫 번째 리프레시
    setTimeout(() => {
      this.triggerNotionRefresh();
    }, 2000);
    
    console.log('📝 노션 자동 리프레시 설정 완료: 2초 후 1회 실행');
  }

  // 📝 노션 리프레시 트리거
  triggerNotionRefresh() {
    // TTS 매니저가 존재하고 requestRefresh 함수가 있으면 호출
    if (window.ttsManager && typeof window.ttsManager.requestRefresh === 'function') {
      console.log('📝 노션 자동 리프레시 실행');
      window.ttsManager.requestRefresh();
    } else {
      console.log('📝 TTS 매니저 또는 requestRefresh 함수를 찾을 수 없음');
    }
  }

  // 🎯 사이트별 특화 제외 요소 판단
  isSiteSpecificExcludedElement(hostname, element, className, elementId) {
    const textContent = element.textContent?.trim() || '';
    const textLength = textContent.length;
    
    // 노션(Notion) 특화 제외 로직
    if (hostname.includes('notion.so') || hostname.includes('notion.site')) {
      // 노션 UI 요소들 제외
      const notionExcludedClasses = [
        'notion-sidebar', 'notion-header', 'notion-footer', 'notion-navigation',
        'notion-menu', 'notion-search', 'notion-breadcrumb', 'notion-toolbar',
        'notion-status-bar', 'notion-comments', 'notion-share', 'notion-export',
        'notion-settings', 'notion-help', 'notion-feedback', 'notion-upgrade',
        'notion-template', 'notion-gallery', 'notion-calendar', 'notion-database',
        'notion-table', 'notion-kanban', 'notion-timeline', 'notion-board'
      ];
      
      if (notionExcludedClasses.some(cls => className.includes(cls) || elementId.includes(cls))) {
        console.log(`📝 노션 제외: "${className}" 또는 "${elementId}"`);
        return true;
      }
      
      // 노션 버튼/인터페이스 텍스트 패턴
      const notionButtonPatterns = [
        /^(add|create|new|edit|delete|share|export|import|duplicate|move|copy)$/i,
        /^(undo|redo|save|cancel|close|back|forward|refresh|reload)$/i,
        /^(search|filter|sort|view|hide|show|expand|collapse)$/i,
        /^(comment|reply|like|bookmark|favorite|star|pin)$/i,
        /^(template|gallery|list|board|calendar|timeline|kanban)$/i,
        /^(upgrade|premium|pro|enterprise|team|workspace)$/i,
        /^(help|support|feedback|bug|feature|request)$/i
      ];
      
      if (notionButtonPatterns.some(pattern => pattern.test(textContent))) {
        console.log(`📝 노션 버튼 텍스트 제외: "${textContent}"`);
        return true;
      }
    }
    
    // 네이버 뉴스 특화 제외 로직
    if (hostname.includes('news.naver.com')) {
      // div class에 vod, video가 들어간 <div>는 테이크 수집에서 제외
      if (className.includes('vod_player_wrap') || className.includes('_VIDEO_AREA_WRAP')) {
        console.log(`📰 네이버 뉴스 비디오 영역 제외: "${className}"`);
        return true;
      }
      
      // vod, video 관련 클래스들 제외
      const naverVideoClasses = [
        'vod_player_wrap',
        '_VIDEO_AREA_WRAP',
        'video_area',
        '_VIDEO_AREA',
        'VOD_PLAYER_ERROR_WRAP'
      ];
      
      if (naverVideoClasses.some(cls => className.includes(cls) || elementId.includes(cls))) {
        console.log(`📰 네이버 뉴스 비디오 관련 요소 제외: "${className}" 또는 "${elementId}"`);
        return true;
      }
    }
    
    // 다음 뉴스 특화 제외 로직
    if (hostname.includes('v.daum.net')) {
      // class="util_wrap" 하위 내용은 모두 제외
      if (className.includes('util_wrap')) {
        return true;
      }
    }
    
    // Billboard.com 특화 제외 로직
    if (hostname.includes('billboard.com')) {
      // Billboard 특화 제외 클래스들
      const billboardExcludedClasses = [
        'pmc-sidebar',          // 사이드바
        'pmc-header',           // 헤더
        'pmc-footer',           // 푸터
        'chart-list',           // 차트 리스트
        'social-share',         // 소셜 공유
        'newsletter',           // 뉴스레터
        'subscribe',            // 구독
        'advertisement',        // 광고
        'trending',             // 트렌딩
        'related-articles',     // 관련 기사
        'author-bio',           // 작가 소개
        'tags',                 // 태그
        'breadcrumb',           // 브레드크럼
        'navigation',           // 네비게이션
        'menu',                 // 메뉴
        'search',               // 검색
        'login',                // 로그인
        'signup'                // 가입
      ];
      
      if (billboardExcludedClasses.some(cls => className.includes(cls) || elementId.includes(cls))) {
        console.log(`🎵 Billboard 제외: "${className}" 또는 "${elementId}"`);
        return true;
      }
      
      // Billboard 특화 인터페이스 텍스트 패턴
      const billboardButtonPatterns = [
        /^(login|sign up|subscribe|newsletter)/i,
        /^(share|follow|like|comment)/i,
        /^(charts|trending|popular)/i,
        /^(previous|next|more|view all)/i,
        /^(billboard hot 100|chart beat)/i
      ];
      
      if (billboardButtonPatterns.some(pattern => pattern.test(textContent))) {
        console.log(`🎵 Billboard 버튼 텍스트 제외: "${textContent}"`);
        return true;
      }
    }
    
    // Music Business Worldwide 특화 제외 로직
    if (hostname.includes('musicbusinessworldwide.com')) {
      const mbwExcludedClasses = [
        'mb-header',            // MBW 헤더
        'mb-footer',            // MBW 푸터
        'mb-sidebar',           // MBW 사이드바
        'mb-newsletter',        // MBW 뉴스레터
        'mb-subscribe',         // MBW 구독
        'mb-social',            // MBW 소셜
        'mb-advertisement',     // MBW 광고
        'mb-related',           // MBW 관련 기사
        'mb-author',            // MBW 작가
        'mb-tags',              // MBW 태그
        'mb-navigation',        // MBW 네비게이션
        'subscription',         // 구독
        'paywall',              // 페이월
        'premium',              // 프리미엄
        'login-form',           // 로그인 폼
        'signup-form'           // 가입 폼
      ];
      
      if (mbwExcludedClasses.some(cls => className.includes(cls) || elementId.includes(cls))) {
        console.log(`🎼 MBW 제외: "${className}" 또는 "${elementId}"`);
        return true;
      }
      
      // MBW 특화 인터페이스 텍스트 패턴
      const mbwButtonPatterns = [
        /^(subscribe|sign up|login|register)/i,
        /^(premium|exclusive|members only)/i,
        /^(read more|continue reading|full story)/i,
        /^(share|tweet|facebook|linkedin)/i,
        /^(newsletter|updates|notifications)/i
      ];
      
      if (mbwButtonPatterns.some(pattern => pattern.test(textContent))) {
        console.log(`🎼 MBW 버튼 텍스트 제외: "${textContent}"`);
        return true;
      }
    }
    
    // CNN 특화 제외 로직
    if (hostname.includes('cnn.com')) {
      const cnnExcludedClasses = [
        'zn-header',            // CNN 헤더
        'zn-footer',            // CNN 푸터
        'zn-navigation',        // CNN 네비게이션
        'zn-sidebar',           // CNN 사이드바
        'ad-slot',              // 광고 슬롯
        'breaking-news',        // 속보 (별도 처리 필요시)
        'related-content',      // 관련 콘텐츠
        'social-follow',        // 소셜 팔로우
        'newsletter-signup',    // 뉴스레터 가입
        'weather-widget',       // 날씨 위젯
        'stock-widget',         // 주식 위젯
        'video-player',         // 비디오 플레이어 (제목/설명은 포함할 수 있음)
        'live-tv',              // 라이브 TV
        'trending-now',         // 지금 트렌딩
        'most-popular'          // 가장 인기
      ];
      
      if (cnnExcludedClasses.some(cls => className.includes(cls) || elementId.includes(cls))) {
        console.log(`📺 CNN 제외: "${className}" 또는 "${elementId}"`);
        return true;
      }
      
      // CNN 특화 인터페이스 텍스트 패턴
      const cnnButtonPatterns = [
        /^(live tv|watch live|breaking news)/i,
        /^(weather|stocks|markets)/i,
        /^(trending|most popular|top stories)/i,
        /^(newsletters|alerts|notifications)/i,
        /^(follow|subscribe|sign up)/i,
        /^(video|gallery|photos)/i,
        /^(related|more stories|see all)/i
      ];
      
      if (cnnButtonPatterns.some(pattern => pattern.test(textContent))) {
        console.log(`📺 CNN 버튼 텍스트 제외: "${textContent}"`);
        return true;
      }
    }
    
    return false;
  }

  // 🎯 사이트별 특화 본문 텍스트 판단
  isSiteSpecificMainContent(hostname, element, text) {
    const className = (element.className || '').toLowerCase();
    const elementId = (element.id || '').toLowerCase();
    const textLength = text.length;
    const tagName = element.tagName.toLowerCase();
    
    // 🎯 모든 사이트에서 제목 태그는 우선 포함 (길이 제한 완화)
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
      if (textLength >= 2) { // 매우 짧은 제목도 포함
        console.log(`🏷️ 제목 태그 우선 포함 (${hostname}): <${tagName}> "${text}"`);
        return true;
      }
    }
    
    // 노션(Notion) 특화 본문 판단
    if (hostname.includes('notion.so') || hostname.includes('notion.site')) {
      // 노션 페이지 제목 (짧아도 의미 있음)
      if (textLength >= 2 && (
        className.includes('notion-page-title') || 
        className.includes('notion-text-block') ||
        className.includes('notion-bulleted-list-block') ||
        className.includes('notion-numbered-list-block') ||
        className.includes('notion-toggle-block') ||
        className.includes('notion-code-block') ||
        className.includes('notion-quote-block') ||
        elementId.includes('notion')
      )) {
        console.log(`📝 노션 콘텐츠 포함: "${text}" (${textLength}자)`);
        return true;
      }
      
      // 노션 특화 본문 영역 클래스
      const notionContentClasses = [
        'notion-page-content', 'notion-page-body', 'notion-content',
        'notion-text-block', 'notion-bulleted-list-block', 'notion-numbered-list-block',
        'notion-toggle-block', 'notion-code-block', 'notion-quote-block'
      ];
      
      if (notionContentClasses.some(cls => className.includes(cls))) {
        console.log(`📝 노션 본문 클래스 감지: "${className}"`);
        return true;
      }
    }
    
    // Billboard.com 특화 본문 판단
    if (hostname.includes('billboard.com')) {
      // Billboard 기사 본문 텍스트 특성
      if (textLength >= 50) {
        // 음악/엔터테인먼트 관련 키워드가 있는 긴 텍스트는 본문일 가능성 높음
        const musicKeywords = [
          'album', 'song', 'music', 'artist', 'singer', 'band', 'concert',
          'billboard', 'chart', 'hit', 'single', 'track', 'record', 'label'
        ];
        
        const hasMusic = musicKeywords.some(keyword => 
          text.toLowerCase().includes(keyword)
        );
        
        if (hasMusic) {
          console.log(`🎵 Billboard 음악 콘텐츠 포함: "${text.substring(0, 50)}..."`);
          return true;
        }
      }
      
      // Billboard 특화 본문 영역 클래스
      const billboardContentClasses = [
        'article-body', 'story-body', 'content-body', 'entry-content',
        'pmc-paywall', 'article-content', 'post-content'
      ];
      
      if (billboardContentClasses.some(cls => className.includes(cls))) {
        console.log(`🎵 Billboard 본문 클래스 감지: "${className}"`);
        return true;
      }
    }
    
    // Music Business Worldwide 특화 본문 판단
    if (hostname.includes('musicbusinessworldwide.com')) {
      // MBW 제목 특성 (짧아도 의미 있음)
      if (textLength >= 10 && (
        className.includes('title') || 
        className.includes('headline') ||
        className.includes('header') ||
        elementId.includes('title')
      )) {
        console.log(`🎼 MBW 제목 요소 포함: "${text}"`);
        return true;
      }
      
      // MBW 기사는 음악 비즈니스 관련 전문 용어가 많음
      if (textLength >= 40) {
        const musicBizKeywords = [
          'record label', 'streaming', 'royalties', 'publishing', 'artist',
          'music industry', 'revenue', 'catalog', 'copyright', 'licensing',
          'spotify', 'apple music', 'universal', 'warner', 'sony'
        ];
        
        const hasMusicBiz = musicBizKeywords.some(keyword => 
          text.toLowerCase().includes(keyword)
        );
        
        if (hasMusicBiz) {
          console.log(`🎼 MBW 음악 비즈니스 콘텐츠 포함: "${text.substring(0, 50)}..."`);
          return true;
        }
      }
      
      // MBW 특화 본문 영역 클래스
      const mbwContentClasses = [
        'mb-article__body', 'post-content', 'entry-content', 
        'article-content', 'content', 'mb-article'
      ];
      
      if (mbwContentClasses.some(cls => className.includes(cls))) {
        console.log(`🎼 MBW 본문 클래스 감지: "${className}"`);
        return true;
      }
    }
    
    // CNN 특화 본문 판단
    if (hostname.includes('cnn.com')) {
      // CNN 제목 특성 (헤드라인 요소들)
      if (textLength >= 8 && (
        className.includes('headline') || 
        className.includes('title') ||
        className.includes('header') ||
        elementId.includes('headline') ||
        elementId.includes('title')
      )) {
        console.log(`📺 CNN 제목 요소 포함: "${text}"`);
        return true;
      }
      
      // CNN 뉴스 기사 특성
      if (textLength >= 50) {
        const newsKeywords = [
          'according to', 'sources said', 'officials', 'president', 'government',
          'congress', 'senate', 'house', 'court', 'investigation', 'report',
          'statement', 'spokesperson', 'breaking', 'developing'
        ];
        
        const hasNews = newsKeywords.some(keyword => 
          text.toLowerCase().includes(keyword)
        );
        
        if (hasNews) {
          console.log(`📺 CNN 뉴스 콘텐츠 포함: "${text.substring(0, 50)}..."`);
          return true;
        }
      }
      
      // CNN 특화 본문 영역 클래스
      const cnnContentClasses = [
        'article__content', 'zn-body__paragraph', 'pg-rail-tall__body',
        'article-body', 'story-body', 'l-container'
      ];
      
      if (cnnContentClasses.some(cls => className.includes(cls))) {
        console.log(`📺 CNN 본문 클래스 감지: "${className}"`);
        return true;
      }
    }
    
    // Zeta AI 특화 본문 판단
    if (hostname.includes('zeta-ai')) {
      // Zeta AI는 적절한 길이의 텍스트만 본문으로 간주 (너무 짧거나 긴 텍스트 제외)
      if (textLength >= 10 && textLength <= 1000) {
        // 버튼, 메뉴, 네비게이션 등은 제외
        const excludedPatterns = [
          /^(로그인|회원가입|검색|메뉴|홈|뒤로|앞으로|닫기|확인|취소)$/,
          /^(login|sign|search|menu|home|back|next|close|ok|cancel)$/i,
          /^[0-9\s\-_\.]+$/,  // 숫자와 특수문자만 있는 텍스트
          /^[a-zA-Z\s\-_\.]+$/  // 영문과 특수문자만 있는 텍스트
        ];
        
        const isExcluded = excludedPatterns.some(pattern => pattern.test(text.trim()));
        if (!isExcluded) {
          console.log(`🤖 Zeta AI 콘텐츠 포함: "${text.substring(0, 30)}..." (${textLength}자)`);
          return true;
        }
      }
    }
    
    // 사이트별 판단 결과가 없으면 null 반환 (일반 로직 적용)
    return null;
  }
}

// 전역 인스턴스 생성
window.htmlAnalyzerSites = new HTMLAnalyzerSites();

console.log('HTML 분석 사이트별 모듈 로드 완료');

