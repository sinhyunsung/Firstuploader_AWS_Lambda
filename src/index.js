const chromium = require('chrome-aws-lambda');

module.exports.handler = async (event, context) => {

  const web=new Mlb("https://24hz.kr/board/bbs/link.php?bo_table=mlbpark&wr_id=8798179&no=1");
  
  await web.chrome_on();
  await web.page_on();
  await web.page_goto();
  const comments = await web.crawling();
  await web.chrome_close();

  //// setTimeout(() => chrome.instance.kill(), 0);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: comments
    })
  }

}


class Crawling{
    constructor(url) {
      this.url=url;
      this.browser;
      this.page;
    }

    async chrome_on(){
      this.browser = await chromium.puppeteer.launch({
        executablePath: await chromium.executablePath,
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        headless: true,
      });
    }
    
    async chrome_close(){  
      await this.browser.close();
    }

    async page_on(){
      this.page = await this.browser.newPage();
    }

    async page_goto(){
      await this.page.goto(this.url);
    }
}

class Mlb extends Crawling{
    
    async crawling(){
        const comments = await this.page.$$eval('.re_txt', comments => comments.map(comment => comment.innerText));
        return comments;
    }
}