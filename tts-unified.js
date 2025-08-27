// 🎯 통합된 TTS 재생 시스템
// 테이크 선택, 화자 변경, 속도 변경 시 모두 같은 함수를 호출

class UnifiedTTSManager {
  constructor() {
    this.currentSessionId = 0; // 🛑 세션 ID로 작업 구분
    this.abortController = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentPlayingTakeId = null;
    this.currentTakeIndex = 0;
    this.currentPlayList = [];
    this.currentAudio = null;
  }

      // 🎯 통합된 재생 시작 함수 (테이크 선택, 화자 변경, 속도 변경 시 모두 호출)
    async unifiedPlaybackStart(startTake = null, ttsManager) {
      ttsManager.log(`🎬 통합 재생 시작 - 테이크: ${startTake ? `${startTake.id} (인덱스: ${startTake.index})` : '현재'}`);
      
      // 🎯 테이크 정보 상세 로깅
      if (startTake) {
        ttsManager.log(`🎯 선택된 테이크 정보:`, {
          id: startTake.id,
          index: startTake.index,
          text: startTake.text?.substring(0, 50) + '...',
          element: startTake.element ? `${startTake.element.tagName}.${startTake.element.className}` : 'null'
        });
      }
      
      ttsManager.log(`🎯 전체 테이크 개수: ${ttsManager.preTakes.length}개`);
      
      // 🛑 모든 기존 작업 완전 중단
      this.stopAll(ttsManager);
      this.clearAllBuffering(ttsManager);
      
      // 🛑 새로운 세션 ID로 기존 작업 무효화
      this.currentSessionId++;
      
      // 🛑 모든 테이크 버퍼링 상태 초기화
      ttsManager.preTakes.forEach(take => {
        take.isBuffered = false;
        take.audioUrl = null;
      });
      
      // 시작 테이크가 지정된 경우 해당 테이크부터, 아니면 현재 선택된 테이크부터
      let startIndex = 0;
      if (startTake) {
        // 🎯 테이크 ID 또는 인덱스로 찾기
        if (startTake.index !== undefined) {
          // 인덱스가 있는 경우 (직접 인덱스 사용)
          startIndex = startTake.index;
          ttsManager.log(`🎯 인덱스 기반 시작: ${startIndex + 1}번째 테이크`);
        } else {
          // ID로 찾기
          startIndex = ttsManager.preTakes.findIndex(take => take.id === startTake.id);
          ttsManager.log(`🎯 ID 기반 시작: ${startTake.id} → ${startIndex + 1}번째 테이크`);
        }
        
        if (startIndex === -1) {
          ttsManager.log(`⚠️ 테이크를 찾을 수 없음, 첫 번째 테이크부터 시작`);
          startIndex = 0;
        }
      }
    
    // 재생 목록 설정
    this.currentPlayList = ttsManager.preTakes.slice(startIndex);
    this.currentTakeIndex = 0;
    this.currentPlayingTakeId = ttsManager.preTakes[startIndex]?.id || null;
    
    ttsManager.log(`📋 새로운 재생 목록: ${this.currentPlayList.length}개 테이크 (${startIndex + 1}번째부터)`);
    
    // UI 업데이트
    ttsManager.updateStatus(`재생 준비 중... (${startIndex + 1}/${ttsManager.preTakes.length})`, '#FF9800');
    if (ttsManager.preTakes[startIndex]) {
      ttsManager.updatePlaybackUI(ttsManager.preTakes[startIndex]);
    }
    
    // 🎯 첫 번째 테이크 재생 시작
    ttsManager.log(`🎯 첫 번째 테이크 재생 시작: 재생 목록 ${this.currentPlayList.length}개`);
    if (this.currentPlayList.length > 0) {
      ttsManager.log(`🎯 첫 번째 테이크 정보:`, {
        id: this.currentPlayList[0].id,
        index: this.currentPlayList[0].index,
        text: this.currentPlayList[0].text?.substring(0, 30) + '...',
        isBuffered: this.currentPlayList[0].isBuffered
      });
    }
    await this.playTakeAtIndex(0, ttsManager);
  }

  // 🎯 TTS 변환 함수 (audiobook-ui 기반)
  async convertToSpeech(take, ttsManager) {
    const sessionId = this.currentSessionId; // 현재 세션 ID 저장
    
    try {
      ttsManager.log(`🔄 TTS 변환 시작: ${take.id}`);
      
      // API 요청용 텍스트 변환
      const apiText = this.convertTextForAPI(take.text);
      
      const apiUrl = ttsManager.apiUrl || "http://localhost:4000"; // ttsManager의 API URL 사용
      const voiceId = ttsManager.selectedVoice.id;
      
      // 🛑 세션 ID 체크 - 중단된 경우 즉시 종료
      if (sessionId !== this.currentSessionId) {
        ttsManager.log(`🛑 세션 ID 불일치 - TTS 변환 중단: ${take.id}`);
        return null;
      }
      
      const response = await fetch(`${apiUrl}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: apiText, 
          voice_id: voiceId,
          language: 'ko', // 기본 한국어
          style: voiceId === '6151a25f6a7f5b1e000023' ? 'excited' : undefined
        }),
        signal: this.abortController?.signal
      });
      
      if (!response.ok) throw new Error(`TTS 변환 실패: ${response.status}`);
      
      // 🛑 세션 ID 재확인 - 응답 후에도 중단된 경우 무시
      if (sessionId !== this.currentSessionId) {
        ttsManager.log(`🛑 세션 ID 불일치 - 응답 무시: ${take.id}`);
        return null;
      }
      
      const audioData = await response.arrayBuffer();
      const blob = new Blob([audioData], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      
      ttsManager.log(`✅ TTS 변환 완료: ${take.id} (${audioData.byteLength} bytes)`);
      return url;
      
    } catch (e) {
      if (e.name === 'AbortError') {
        ttsManager.log(`🛑 TTS 변환 중단됨: ${take.id}`);
      } else {
        ttsManager.error(`❌ TTS 변환 실패: ${take.id}`, e);
      }
      return null;
    }
  }

  // 🎯 오디오 재생 함수 (audiobook-ui 기반)
  async playTakeAtIndex(playListIndex, ttsManager) {
    const sessionId = this.currentSessionId; // 현재 세션 ID 저장
    
    // 🛑 세션 ID 체크 - 중단된 경우 즉시 종료
    if (sessionId !== this.currentSessionId) {
      ttsManager.log(`🛑 세션 ID 불일치 - 재생 중단: ${playListIndex}`);
      return;
    }
    
    if (!this.currentPlayList || playListIndex >= this.currentPlayList.length) {
      ttsManager.log('✅ 모든 테이크 재생 완료');
      ttsManager.updateStatus('재생 완료', '#4CAF50');
      return;
    }
    
    const take = this.currentPlayList[playListIndex];
    this.currentTakeIndex = playListIndex;
    this.currentPlayingTakeId = take.id;
    
    ttsManager.log(`🎵 테이크 재생: ${take.id} (${playListIndex + 1}/${this.currentPlayList.length})`);
    
    // UI 업데이트
    ttsManager.updatePlaybackUI(take);
    ttsManager.updateStatus(`재생 중... (${playListIndex + 1}/${this.currentPlayList.length})`, '#4CAF50');
    
    try {
      let audioUrl;
      
      // 이미 버퍼링된 경우 바로 재생
      if (take.isBuffered && take.audioUrl) {
        ttsManager.log(`🎯 버퍼링된 오디오 즉시 재생: ${take.id}`);
        audioUrl = take.audioUrl;
      } else {
        // 실시간 생성
        ttsManager.log(`🔄 테이크 실시간 생성: ${take.id}`);
        ttsManager.updateStatus(`음성 생성 중... (${playListIndex + 1}/${this.currentPlayList.length})`, '#FF9800');
        
        // 테이크 위치로 스크롤
        if (take.element) {
          take.element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
        
        // 버퍼링 애니메이션 적용 (함수가 있는 경우만)
        if (ttsManager.applyBufferingAnimation) {
          ttsManager.applyBufferingAnimation(take.element);
        }
        
        try {
          audioUrl = await this.convertToSpeech(take, ttsManager);
          if (audioUrl && sessionId === this.currentSessionId) {
            take.audioUrl = audioUrl;
            take.isBuffered = true;
          }
        } finally {
          // 버퍼링 애니메이션 제거 (함수가 있는 경우만)
          if (ttsManager.removeBufferingAnimation) {
            ttsManager.removeBufferingAnimation(take.element);
          }
        }
      }
      
      if (audioUrl && sessionId === this.currentSessionId) {
        await this.playAudioWithTracking(audioUrl, take, ttsManager);
        
        // 🎯 다음 테이크 버퍼링 시작
        if (sessionId === this.currentSessionId) {
          // maintainContinuousBuffering 호출 전에 로그 추가
          ttsManager.log(`🎯 버퍼링 시작: 현재 ${playListIndex + 1}번째 테이크`);
          this.maintainContinuousBuffering(playListIndex, ttsManager);
        }
      } else {
        ttsManager.error(`❌ 테이크 재생 실패: ${take.id}`);
        // 다음 테이크로 넘어가기
        await this.playTakeAtIndex(playListIndex + 1, ttsManager);
      }
      
    } catch (error) {
      ttsManager.error(`❌ 테이크 재생 중 오류: ${take.id}`, error);
      // 다음 테이크로 넘어가기
      await this.playTakeAtIndex(playListIndex + 1, ttsManager);
    }
  }

  // 🎯 연속적 버퍼링 관리자 (audiobook-ui 기반)
  async maintainContinuousBuffering(currentIndex, ttsManager) {
    const sessionId = this.currentSessionId; // 현재 세션 ID 저장
    
    // 🛑 세션 ID 체크 - 중단된 경우 즉시 종료
    if (sessionId !== this.currentSessionId) {
      ttsManager.log(`🛑 세션 ID 불일치 - 연속 버퍼링 중단`);
      return;
    }
    
    ttsManager.log(`🔄 연속적 버퍼링 확인: ${currentIndex + 1}번째 테이크 기준`);
    
    const bufferAhead = 5; // 현재 테이크 뒤로 5개 유지
    const unbufferedTakes = [];
    
    // 🎯 재생 목록 기준으로 버퍼링 인덱스 계산
    // currentIndex는 재생 목록 내 인덱스이므로, 원본 preTakes 배열의 실제 인덱스로 변환 필요
    const actualTakeIndex = this.getOriginalTakeIndex(currentIndex, ttsManager);
    
    ttsManager.log(`🎯 원본 테이크 인덱스: ${actualTakeIndex + 1}번째 (재생 목록 ${currentIndex + 1}번째)`);
    
    // 버퍼링이 필요한 테이크들 찾기
    for (let i = actualTakeIndex + 1; i <= Math.min(actualTakeIndex + bufferAhead, ttsManager.preTakes.length - 1); i++) {
      if (!ttsManager.preTakes[i].isBuffered) {
        unbufferedTakes.push({ index: i, take: ttsManager.preTakes[i] });
      }
    }
    
    if (unbufferedTakes.length > 0) {
      ttsManager.log(`📦 버퍼링 필요: ${unbufferedTakes.length}개 테이크`);
      
      // 순차적으로 버퍼링
      for (const { index, take } of unbufferedTakes) {
        // 🛑 세션 ID 재확인
        if (sessionId !== this.currentSessionId) {
          ttsManager.log(`🛑 세션 ID 불일치 - 순차 버퍼링 중단`);
          return;
        }
        
        await this.prepareNextTake(index, ttsManager);
        
        // 100ms 간격으로 다음 테이크 처리
        if (sessionId === this.currentSessionId) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
  }

  // 🎯 다음 테이크 버퍼링 함수 (audiobook-ui 기반)
  async prepareNextTake(nextIndex, ttsManager) {
    const sessionId = this.currentSessionId; // 현재 세션 ID 저장
    
    // 🛑 세션 ID 체크 - 중단된 경우 즉시 종료
    if (sessionId !== this.currentSessionId) {
      ttsManager.log(`🛑 세션 ID 불일치 - 버퍼링 중단: ${nextIndex}`);
      return;
    }
    
    if (nextIndex >= ttsManager.preTakes.length || ttsManager.preTakes[nextIndex]?.isBuffered) {
      return; // 이미 생성됨 또는 범위 초과
    }
    
    try {
      const take = ttsManager.preTakes[nextIndex];
      ttsManager.log(`🔄 다음 테이크 미리 생성: ${nextIndex}`);
      
      // 백그라운드에서 생성
      const audioUrl = await this.convertToSpeech(take, ttsManager);
      if (audioUrl && sessionId === this.currentSessionId) {
        take.audioUrl = audioUrl;
        take.isBuffered = true;
        ttsManager.log(`✅ 테이크 ${nextIndex} 미리 생성 완료`);
      }
    } catch (error) {
      ttsManager.error(`❌ 테이크 ${nextIndex} 미리 생성 실패:`, error);
    }
  }

  // 🎯 오디오 재생 및 트래킹
  async playAudioWithTracking(audioUrl, take, ttsManager) {
    const sessionId = this.currentSessionId;
    
    return new Promise((resolve, reject) => {
      if (sessionId !== this.currentSessionId) {
        ttsManager.log(`🛑 세션 ID 불일치 - 오디오 재생 중단`);
        resolve();
        return;
      }
      
      this.currentAudio = new Audio(audioUrl);
      this.isPlaying = true;
      this.isPaused = false;
      
      this.currentAudio.onended = () => {
        this.isPlaying = false;
        ttsManager.log(`테이크 ${take.id} 재생 완료`);
        
        // 🎯 테이크 종료 후 0.5초 지연
        setTimeout(() => {
          // 다음 테이크 재생
          if (this.currentTakeIndex + 1 < this.currentPlayList.length) {
            ttsManager.log(`🎯 다음 테이크로 이동: ${this.currentTakeIndex + 2}번째`);
            this.playTakeAtIndex(this.currentTakeIndex + 1, ttsManager);
          } else {
            // 모든 테이크 재생 완료
            ttsManager.log(`✅ 모든 테이크 재생 완료`);
            ttsManager.updateStatus('재생 완료', '#4CAF50');
          }
          
          resolve();
        }, 500);
      };
      
      this.currentAudio.onerror = (error) => {
        ttsManager.error('오디오 재생 오류:', error);
        ttsManager.updateStatus('재생 오류', '#F44336');
        reject(error);
      };
      
      this.currentAudio.play().catch(reject);
    });
  }

  // 🎯 완전한 중단 및 초기화 함수
  stopAll(ttsManager) {
    ttsManager.log('🛑 모든 재생 및 생성 작업 중단');
    
    // 현재 오디오 중지
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio.src = '';
    }
    
    // AbortController로 진행 중인 요청 중단
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    
    // 재생 상태 초기화
    this.isPlaying = false;
    this.isPaused = false;
    this.currentPlayingTakeId = null;
    
    // 세션 ID 증가로 기존 작업 무효화
    this.currentSessionId++;
    
    ttsManager.log('✅ 모든 작업 중단 완료');
  }

  // 🎯 모든 버퍼링 제거 함수
  clearAllBuffering(ttsManager) {
    ttsManager.log('🗑️ 모든 버퍼링 제거');
    
    // Blob URL 해제
    ttsManager.preTakes.forEach(take => {
      if (take.audioUrl && take.audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(take.audioUrl);
      }
      take.audioUrl = null;
      take.isBuffered = false;
    });
    
    // 플레이리스트 초기화
    this.currentPlayList = [];
    this.currentTakeIndex = 0;
    
    // 세션 ID 증가로 기존 작업 무효화
    this.currentSessionId++;
    
    ttsManager.log('✅ 모든 버퍼링 제거 완료');
  }

  // 🎯 원본 테이크 인덱스 계산 (재생 목록 인덱스를 원본 인덱스로 변환)
  getOriginalTakeIndex(playListIndex, ttsManager) {
    if (!this.currentPlayList || playListIndex >= this.currentPlayList.length) {
      return 0;
    }
    
    const currentTake = this.currentPlayList[playListIndex];
    const originalIndex = ttsManager.preTakes.findIndex(take => take.id === currentTake.id);
    
    ttsManager.log(`🎯 인덱스 변환: 재생 목록 ${playListIndex + 1}번째 → 원본 ${originalIndex + 1}번째`);
    
    return originalIndex >= 0 ? originalIndex : 0;
  }

  // 🎯 텍스트 API 변환 함수
  convertTextForAPI(text) {
    // 간단한 텍스트 정제 (필요시 확장)
    return text.trim();
  }
}

// 전역 인스턴스 생성
window.unifiedTTSManager = new UnifiedTTSManager();

console.log('통합 TTS 매니저 로드 완료');
