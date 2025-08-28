/**
 * Gemini API 호출 모듈
 * YouTube 동영상 내용을 책의 문장으로 재구성하는 기능
 */

class GeminiAPI {
  constructor() {
    // 여러 API 키를 배열로 관리 (할당량 초과 시 대체 키 사용)
    this.API_KEYS = [
      'AIzaSyBSs6UYJr4iKrmjXeu9ZF7nCCcugs3GFkk', // 새로운 API 키 (우선 사용)
      'AIzaSyCU-7kZ8gT3HB5UMCoN9QbUsAGHH4fAiug', // 이전 키 (백업용)
      'AIzaSyCaq-loSooOhJzXv_1N1ha5JVwfqV4ipxw', // 기존 키 (백업용)
      'AIzaSyBrc-5zYbIGATxlDWz_DTfZcyH5CSPoaYg', // YouTube API 키를 Gemini용으로도 사용
    ];
    this.currentKeyIndex = 0; // 현재 사용 중인 키 인덱스
    
    this.API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    this.MODEL = 'gemini-1.5-flash';
    this.FALLBACK_MODEL = 'gemini-1.0-pro';
    this.FALLBACK_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent';
    this.YOUTUBE_API_KEY = 'AIzaSyBrc-5zYbIGATxlDWz_DTfZcyH5CSPoaYg'; // YouTube Data API 키
  }
  
  // 현재 API 키 가져오기
  getCurrentAPIKey() {
    return this.API_KEYS[this.currentKeyIndex];
  }
  
  // 다음 API 키로 전환
  switchToNextAPIKey() {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.API_KEYS.length;
    console.log('🎥 YouTube: API 키 전환됨 (인덱스:', this.currentKeyIndex, ')');
    return this.getCurrentAPIKey();
  }

  // YouTube URL에서 비디오 ID 추출
  extractVideoId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  // YouTube Data API로 비디오 정보 가져오기
  async getYouTubeVideoInfo(videoId) {
    try {
      console.log('🎥 YouTube: YouTube Data API 호출 시작');
      console.log('🎥 YouTube: 비디오 ID:', videoId);
      console.log('🎥 YouTube: YouTube API 키 (앞 10자리):', this.YOUTUBE_API_KEY.substring(0, 10) + '...');
      
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${this.YOUTUBE_API_KEY}`;
      console.log('🎥 YouTube: YouTube API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      console.log('🎥 YouTube: YouTube API 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎥 YouTube: YouTube API 오류 응답:', errorText);
        throw new Error(`YouTube API 오류: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('🎥 YouTube: YouTube API 응답 데이터:', data);
      
      if (data.items && data.items.length > 0) {
        const video = data.items[0];
        const videoInfo = {
          title: video.snippet.title,
          description: video.snippet.description,
          channelTitle: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          duration: video.contentDetails.duration,
          viewCount: video.statistics.viewCount,
          likeCount: video.statistics.likeCount
        };
        
        console.log('🎥 YouTube: 비디오 정보 추출 완료:', videoInfo);
        return videoInfo;
      } else {
        console.error('🎥 YouTube: 비디오 정보를 찾을 수 없음');
        throw new Error('비디오 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('🎥 YouTube: YouTube Data API 호출 실패:', error);
      console.error('🎥 YouTube: 오류 상세:', error.message);
      throw error;
    }
  }

  // YouTube URL을 책의 문장으로 재구성하는 요청
  async convertYouTubeToBookContent(youtubeUrl) {
    try {
      console.log('🎥 YouTube: 비디오 정보 수집 시작');
      console.log('🎥 YouTube: 입력 URL:', youtubeUrl);
      
      // 비디오 ID 추출
      const videoId = this.extractVideoId(youtubeUrl);
      console.log('🎥 YouTube: 추출된 비디오 ID:', videoId);
      
      if (!videoId) {
        throw new Error('유효하지 않은 YouTube URL입니다.');
      }
      
      // YouTube Data API로 비디오 정보 가져오기
      console.log('🎥 YouTube: YouTube Data API 호출 시작');
      const videoInfo = await this.getYouTubeVideoInfo(videoId);
      console.log('🎥 YouTube: 비디오 정보 수집 완료', videoInfo);
      
      // Gemini API로 분석 요청
      const prompt = `다음 YouTube 비디오 정보를 바탕으로 요약해줘:

제목: ${videoInfo.title}
채널: ${videoInfo.channelTitle}
업로드 날짜: ${videoInfo.publishedAt}
조회수: ${videoInfo.viewCount}
좋아요 수: ${videoInfo.likeCount}
설명: ${videoInfo.description.substring(0, 500)}...

이 영상을 책의 문장으로 활용하게 충분한 분량으로 재구성 해줘. 해당 콘텐츠에 맞는 문체로, 문장의 나열로, 표나 카테고리 구분을 짓지 않고, 소제목도 필요없어. 가능하다면 여러 문단으로 구성해줘. 만약 댓글이 있다면 댓글내용도 요약해서 마지막에 문장 하나로 구성해줘. 내용 앞뒤에 답변도 절대 달지 말아줘.`;

      console.log('🎥 YouTube: Gemini API 호출 시작');
      const response = await this.callAPITextOnly(prompt);
      console.log('🎥 YouTube: Gemini API 응답 받음, 길이:', response ? response.length : 0);
      
      if (response) {
        console.log('🎥 YouTube: 응답 미리보기:', response.substring(0, 200) + '...');
      }
      
      return response;
    } catch (error) {
      console.error('🎥 YouTube: Gemini API 호출 실패:', error);
      console.error('🎥 YouTube: 오류 상세:', error.message);
      throw error; // null 대신 오류를 다시 던져서 상위에서 처리하도록 함
    }
  }

  // Gemini API 텍스트 전용 호출
  async callAPITextOnly(prompt, retryCount = 0) {
    try {
      console.log('🎥 YouTube: Gemini API 호출 시작 (retry:', retryCount, ')');
      console.log('🎥 YouTube: API URL:', this.API_URL);
      console.log('🎥 YouTube: 현재 API 키 인덱스:', this.currentKeyIndex);
      console.log('🎥 YouTube: API 키 (앞 10자리):', this.getCurrentAPIKey().substring(0, 10) + '...');
      
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      };

      console.log('🎥 YouTube: 요청 본문 길이:', JSON.stringify(requestBody).length);

      const response = await fetch(`${this.API_URL}?key=${this.getCurrentAPIKey()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🎥 YouTube: API 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎥 YouTube: API 오류 응답:', errorText);
        
        // 429 에러 (할당량 초과) 처리
        if (response.status === 429) {
          // 다른 API 키가 있는지 확인
          if (this.API_KEYS.length > 1 && retryCount < this.API_KEYS.length) {
            console.log(`🎥 YouTube: API 키 ${this.currentKeyIndex} 할당량 초과, 다음 키로 전환...`);
            this.switchToNextAPIKey();
            return this.callAPITextOnly(prompt, retryCount + 1);
          } else if (retryCount < 3) {
            // 모든 키를 시도했거나 키가 하나뿐인 경우, 대기 후 재시도
            const waitTime = Math.max(37, 10 * (retryCount + 1)); // 최소 37초 대기
            console.log(`🎥 YouTube: 모든 API 키 할당량 초과, ${waitTime}초 후 재시도...`);
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            return this.callAPITextOnly(prompt, retryCount + 1);
          }
        }
        
        throw new Error(`Gemini API 오류: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🎥 YouTube: API 응답 데이터 구조:', Object.keys(data));
      
      // Gemini API 응답 구조 확인
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const result = data.candidates[0].content.parts[0].text;
        console.log('🎥 YouTube: Gemini API 응답 성공, 결과 길이:', result.length);
        return result;
      } else if (data.promptFeedback && data.promptFeedback.blockReason) {
        console.error('🎥 YouTube: 콘텐츠 차단됨:', data.promptFeedback.blockReason);
        throw new Error(`콘텐츠 차단됨: ${data.promptFeedback.blockReason}`);
      } else {
        console.error('🎥 YouTube: API 응답 형식 오류:', data);
        throw new Error('Gemini API 응답 형식 오류');
      }
    } catch (error) {
      console.error('🎥 YouTube: Gemini API 호출 실패:', error);
      console.error('🎥 YouTube: 오류 타입:', error.constructor.name);
      throw error;
    }
  }

  // Gemini API 비디오 호출 (향후 사용)
  async callAPI(prompt, youtubeUrl) {
    try {
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              {
                fileData: {
                  fileUri: youtubeUrl,
                  mimeType: 'video/mp4'
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      };

      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API 오류: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      // Gemini API 응답 구조 확인
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else if (data.promptFeedback && data.promptFeedback.blockReason) {
        throw new Error(`콘텐츠 차단됨: ${data.promptFeedback.blockReason}`);
      } else {
        throw new Error('Gemini API 응답 형식 오류');
      }
    } catch (error) {
      console.error('Gemini API 호출 실패:', error);
      throw error;
    }
  }

  // 스트리밍 응답 처리 (텍스트 전용)
  async callAPIStreaming(prompt, onChunk) {
    try {
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      };

      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API 오류: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const content = data.candidates[0].content.parts[0].text;
        if (onChunk) {
          // 스트리밍 시뮬레이션 (실제 스트리밍은 별도 엔드포인트 필요)
          const chunks = content.split(' ');
          for (const chunk of chunks) {
            onChunk(chunk + ' ');
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        return content;
      } else {
        throw new Error('Gemini API 응답 형식 오류');
      }
    } catch (error) {
      console.error('Gemini API 스트리밍 호출 실패:', error);
      throw error;
    }
  }

  // YouTube URL 유효성 검사
  isValidYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return youtubeRegex.test(url);
  }

  // YouTube URL 정규화
  normalizeYouTubeUrl(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) {
      return `https://www.youtube.com/watch?v=${match[1]}`;
    }
    return url;
  }
}

// 전역 인스턴스 생성
window.geminiAPI = new GeminiAPI();

// API 키 유효성 테스트 함수 추가
window.geminiAPI.testAPIKeys = async function() {
  console.log('🔍 API 키 테스트 시작');
  
  try {
    // Gemini API 키 테스트
    console.log('🔍 Gemini API 키 테스트');
    const testResponse = await this.callAPITextOnly('안녕하세요. 간단한 테스트입니다.');
    console.log('✅ Gemini API 키 유효:', testResponse ? '성공' : '실패');
    
    // YouTube API 키 테스트 (간단한 검색)
    console.log('🔍 YouTube API 키 테스트');
    const testVideoId = 'dQw4w9WgXcQ'; // Rick Roll 비디오 ID
    const testVideoInfo = await this.getYouTubeVideoInfo(testVideoId);
    console.log('✅ YouTube API 키 유효:', testVideoInfo ? '성공' : '실패');
    
    return true;
  } catch (error) {
    console.error('❌ API 키 테스트 실패:', error);
    return false;
  }
};

console.log('Gemini API 모듈 로드 완료');
console.log('API 키 테스트를 위해 브라우저 콘솔에서 다음을 실행하세요:');
console.log('window.geminiAPI.testAPIKeys()');
