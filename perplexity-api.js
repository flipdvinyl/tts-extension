/**
 * Perplexity API 호출 모듈
 * YouTube 동영상 내용을 책의 문장으로 재구성하는 기능
 */

class PerplexityAPI {
  constructor() {
    this.API_KEY = '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';
    this.API_URL = 'https://api.perplexity.ai/chat/completions';
    this.MODEL = 'sonar-pro';
  }

  // YouTube URL을 책의 문장으로 재구성하는 요청
  async convertYouTubeToBookContent(youtubeUrl) {
    try {
      const question = `${youtubeUrl} 이 유튜브 영상을 책의 문장으로 활용하게 충분한 분량으로 재구성 해줘. 해당 콘텐츠에 맞는 문체로, 문장의 나열로, 표나 카테고리 구분을 짓지 않고, 소제목도 필요없어. 가능하다면 여러 문단으로 구성해줘. 만약 댓글이 있다면 댓글내용도 요약해서 마지막에 문장 하나로 구성해줘. 최대 2000자가 넘지 않게 해줘. 내용 앞뒤에 답변도 절대 달지 말아줘.`;

      const response = await this.callAPI(question);
      return response;
    } catch (error) {
      console.error('Perplexity API 호출 실패:', error);
      return null;
    }
  }

  // Perplexity API 호출
  async callAPI(question) {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'user',
              content: question
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API 오류: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || null;
    } catch (error) {
      console.error('Perplexity API 호출 실패:', error);
      throw error;
    }
  }

  // 스트리밍 응답 처리 (향후 확장용)
  async callAPIStreaming(question, onChunk) {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'user',
              content: question
            }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API 오류: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content && onChunk) {
                onChunk(content);
              }
            } catch (e) {
              // 무시
            }
          }
        }
      }
    } catch (error) {
      console.error('Perplexity API 스트리밍 호출 실패:', error);
      throw error;
    }
  }
}

// 전역 인스턴스 생성
window.perplexityAPI = new PerplexityAPI();

console.log('Perplexity API 모듈 로드 완료');
