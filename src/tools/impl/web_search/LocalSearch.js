const { chromium } = require('playwright');
const cheerio = require('cheerio');

/**
 * 本地搜索服务，基于 Playwright 爬取 Bing 或 Baidu 搜索结果。
 * 全局共享 browser：
 *   使用单一的 this.browser 实例，服务所有任务。
 *   通过 initializeBrowser 方法延迟初始化，并在需要时复用。
 *   监听 disconnected 事件，确保浏览器关闭时清理状态。
 * 按 uid 复用 BrowserContext：
 *   为每个 uid 创建一个独立的 BrowserContext，存储在 this.contexts 中。
 *   BrowserContext 提供会话隔离（如 cookie、缓存），但共享同一 browser，显著降低资源占用。
 *   监听 close 事件，自动清理 contexts。
 * 临时创建和关闭 page：
 *   在内部方法中创建临时 page，加载 URL 后立即关闭，避免长期占用内存。
 *   使用 try-finally 确保 page 始终关闭。
 * 并发控制：
 *   引入 maxConcurrentPages（默认 10），限制同时打开的页面数。
 *   使用 waitForPageSlot 和 releasePageSlot 管理并发，防止资源耗尽。
 * 搜索接口：
 *   提供 search 方法，接受查询和选项，支持 Bing 和 Baidu 搜索引擎。
 *   支持 formatContent 和 formatJSON 格式化结果。
 * 清理方法：
 *   cleanup 方法关闭所有 context 和 browser。
 * 
 * Generate by grok3, adapted for Bing and Baidu search
 */
class LocalSearchServer {
  constructor() {

  }
  static instance = null;
  browser = null; // 全局共享的 browser 实例
  contexts = new Map(); // 存储 context 实例，按 uid 管理
  maxConcurrentPages = 10; // 最大并发页面数
  activePages = 0; // 当前活跃页面数
  result = null; // 存储最近一次搜索结果

  static getInstance() {
    if (!LocalSearchServer.instance) {
      LocalSearchServer.instance = new LocalSearchServer();
    }
    return LocalSearchServer.instance;
  }

  // 初始化全局 browser
  async initializeBrowser() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox'],
      });
      this.browser.on('disconnected', () => {
        this.browser = null;
        this.contexts.clear();
      });
    }
    return this.browser;
  }

  // 获取或创建 context
  async getOrCreateContext(uid) {
    let context = this.contexts.get(uid);
    if (!context) {
      const browser = await this.initializeBrowser();
      context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      });
      this.contexts.set(uid, context);
      context.on('close', () => {
        this.contexts.delete(uid);
      });
    }
    return context;
  }

  // 等待可用页面槽位
  async waitForPageSlot() {
    while (this.activePages >= this.maxConcurrentPages) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    this.activePages++;
  }

  // 释放页面槽位
  releasePageSlot() {
    this.activePages--;
  }

  // 解析 Bing 搜索结果 当前HTML解析日期 2025/5/13
  parseBingSearchResults(html) {
    const $ = cheerio.load(html);
    const results = [];

    $('li.b_algo').each((index, element) => {
      const $element = $(element);
      const titleElement = $element.find('h2 a');
      const title = titleElement.text().trim();
      const url = titleElement.attr('href');

      let content = '';
      // 优先尝试 p.b_lineclamp3
      let contentElement = $element.find('p.b_lineclamp3');
      if (contentElement.length) {
        const contentClone = contentElement.clone();
        const dateSpan = contentClone.find('span.news_dt');
        if (dateSpan.length) {
          dateSpan.remove();
        }
        content = contentClone.text().trim().replace(/\s+/g, ' ');
      } else {
        // 尝试 b_caption 下的 p
        contentElement = $element.find('.b_caption p');
        if (contentElement.length) {
          const contentClone = contentElement.clone();
          const dateSpan = contentClone.find('span.news_dt');
          if (dateSpan.length) {
            dateSpan.remove();
          }
          content = contentClone.text().trim().replace(/\s+/g, ' ');
        } else {
          // 尝试 b_dList 下的 span
          const listItems = $element.find('.b_dList .lisn_olitem span');
          if (listItems.length) {
            const contents = [];
            listItems.each((i, item) => {
              const $item = $(item);
              // 优先使用 title 属性（完整文本），否则使用文本内容
              const text = $item.attr('title') || $item.text().trim();
              if (text) {
                contents.push(text);
              }
            });
            content = contents.join(' ').trim().replace(/\s+/g, ' ');
          }
        }
      }

      if (title && url) {
        results.push({
          url,
          title,
          content: content || '',
        });
      }
    });

    return results;
  }

  // 解析 Baidu 搜索结果 当前HTML解析日期 2025/5/13
  parseBaiduSearchResults(html) {
    const $ = cheerio.load(html);
    const results = [];

    $('div.result.c-container').each((index, element) => {
      const $element = $(element);
      const titleElement = $element.find('h3.t a');
      // 清理  标签，获取纯文本
      const title = titleElement
        .clone() // 克隆以避免修改原始 DOM
        .find('em')
        .remove()
        .end()
        .text()
        .trim();
      const url = titleElement.attr('href');
      const contentElement = $element.find('span.content-right_2s-H4');
      const content = contentElement.text().trim();

      if (title && url && content) {
        results.push({
          url,
          title,
          content: content || '',
        });
      }
    });

    return results;
  }

  // 内部方法：加载 URL 并返回 HTML
  async #openUrlInSearchWindow(uid, url) {
    await this.waitForPageSlot();
    const context = await this.getOrCreateContext(uid);
    let page;

    try {
      page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });
      // 等待搜索结果或列表加载
      // await Promise.race([
      //   page.waitForSelector('li.b_algo', { timeout: 10000 }),
      //   page.waitForSelector('.b_dList', { timeout: 10000 }),
      // ]).catch(() => {
      //   console.warn('No b_algo or b_dList elements found, proceeding with available content');
      // });
      // 额外等待动态内容
      await page.waitForTimeout(1000);
      const html = await page.content();
      return html;
    } finally {
      if (page) await page.close();
      this.releasePageSlot();
    }
  }

  /**
   * 搜索接口 core function
    输入：
    args:
      query: string
      options: {
        uid: string, // 用户 ID default: 'default'
        max_results: number, // 最大结果数 default: 3
        engine: string, // bing or baidu; default: 'bing'
       }
    输出：
    
      result:{
        query: string
        results: list of { title: string, url: string, content: string }
      };
     
    example:
      input: query:'四月日本旅行之旅'
             options:{ uid: 'user1',max_results: 3 , engine : 'bing'}
      output: result:{
             query: '四月日本旅行之旅',
              results: [
              {
                url: 'https://blog.oilart.me/4%E6%9C%88%E6%97%A5%E6%9C%AC%E5%A5%BD%E5%8E%BB%E8%99%95/',
                title: '10大4月必訪日本景點：賞櫻、祭典、踏青全攻略 ...',
                content: '· 本篇文章將為您精選10個四月必訪的日本景點，無論您是想沉浸在浪漫的櫻花雨中，或是感受熱鬧的祭典氛圍，都能在這裡找到完美的旅遊靈感。 讓我們一起展開一場充滿驚喜的春日之旅吧 ！ 一個人三天兩夜的行程衣物、 …'
              },
              {
                url: 'https://injapan.cc/4%e6%9c%88%e9%81%a9%e5%90%88%e5%8e%bb%e6%97%a5%e6%9c%ac%e5%93%aa%e8%a3%a1%e7%8e%a9%ef%bc%9f',
                title: '4月適合去日本哪裡玩？櫻花盛開時節，深入探索日本 ...',
                content: '· 不論您選擇哪個城市，在4月的日本旅行，您都能體驗到令人難忘的賞櫻之旅。 沉浸在粉紅色的花海中，欣賞大自然的壯觀奇景，留下永恆的回憶。 Photos provided by …'
              },
              {
                url: 'https://roasterpig.blogspot.com/2025/04/japan-april-travel.html',
                title: '4月日本自由行 避坑防踩雷攻略：天氣與衣服穿搭 ...',
                content: '· 四月是去日本旅遊的重頭戲，櫻花盛開的季節。 去日本玩的人肯定不少，不過你知道，日本的旅遊規定發生什麼變化嗎？ 櫻花季節正盛開，四月去日本旅行要注意什麼？'
              }
              ]
             }
     */
  async search(query, options = {}) {
    const defaultOptions = {
      uid: 'default', // 默认用户 ID
      max_results: 5, // 最大结果数
      engine: 'bing', // 默认搜索引擎
    };

    const requestOptions = {
      ...defaultOptions,
      ...options,
      query,
    };

    try {
      let url;
      let results;
      if (requestOptions.engine.toLowerCase() === 'baidu') {
        url = `https://www.baidu.com/s?wd=${encodeURIComponent(requestOptions.query)}`;
        const html = await this.#openUrlInSearchWindow(requestOptions.uid, url);
        results = this.parseBaiduSearchResults(html);
      } else {
        url = `https://www.bing.com/search?q=${encodeURIComponent(requestOptions.query)}`;
        console.log('url', url);
        const html = await this.#openUrlInSearchWindow(requestOptions.uid, url);
        results = this.parseBingSearchResults(html);
      }

      this.result = {
        query: requestOptions.query,
        results: results.slice(0, requestOptions.max_results),
      };
      return this.result;
    } catch (error) {
      console.error(`LocalSearchServer ${requestOptions.engine} 搜索错误:`, error);
      throw error;
    }
  }

  // 格式化为字符串
  async formatContent() {
    if (!this.result || !this.result.results) {
      return '';
    }
    const { query, results = [] } = this.result;
    const list = results.map((item) =>
      `URL: ${item.url}\nTitle: ${item.title}\ncontent: ${item.content}\n`
    );
    return `Query: ${query}\n${list.join('======\n======')}`;
  }

  // 格式化为 JSON
  async formatJSON() {
    if (!this.result || !this.result.results) {
      return [];
    }
    return this.result.results;
  }

  // 清理所有资源
  async cleanup() {
    for (const context of this.contexts.values()) {
      await context.close();
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.contexts.clear();
    this.activePages = 0;
    this.result = null;
  }
}

module.exports = LocalSearchServer;