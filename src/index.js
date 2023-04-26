const chromium = require('chrome-aws-lambda');


class Crawling{
  constructor(url) {
    this.url=url;
    this.browser;
    this.page;
    this.downloadedResources= new Set();
  }

  async chrome_on(){
    const minimal_args = [...chromium.args,
      '--autoplay-policy=user-gesture-required',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-dev-shm-usage',
      '--disable-domain-reliability',
      '--disable-extensions',
      '--disable-features=AudioServiceOutOfProcess',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-notifications',
      '--disable-offer-store-unmasked-wallet-cards',
      '--disable-popup-blocking',
      '--disable-print-preview',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-setuid-sandbox',
      '--disable-speech-api',
      '--disable-sync','--disable-web-security', '--disable-features=IsolateOrigins,site-per-process',
      '--hide-scrollbars',
      '--ignore-gpu-blacklist',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-first-run',
      '--no-pings',
      '--no-sandbox',
      '--no-zygote',
      '--password-store=basic',
      '--use-gl=swiftshader',
      '--use-mock-keychain',
      '--window-size=1920,1080',
      ];

    this.browser = await chromium.puppeteer.launch({
      executablePath: await chromium.executablePath,
      args: minimal_args,
      waitForInitialPage: true,
      defaultViewport: chromium.defaultViewport,
      headless: true,
      ignoreHTTPSErrors: true,
    });
  }
  
  async chrome_close(){  
    await this.page.close();
    await this.browser.close();
  }

  async page_on(){
    this.page = await this.browser.newPage(); 
    // this.page_resource_off();
  }

  async page_resource_off(){
    
    // this.page.on('console', message => console.log(message.text()));
    
      const blockResource = [
        'image', 
        //'script', 
        'stylesheet', 
        // 'xhr', 
        'font', 
        // 'other'
      ];

     await this.page.setRequestInterception(true);

      this.page.on('request', req => {
        // resource type
        const resource = req.resourceType();
      
        if (blockResource.indexOf(resource) !== -1) {
          // check if the resource has been downloaded before
          if (this.downloadedResources.has(req.url())) {
            req.continue(); // allow previously downloaded resources
          } else {
            this.downloadedResources.add(req.url()); // add the resource to the downloaded set
            req.abort(); // allow new resources to be downloaded
          }
        } else {
            req.continue();
        }
      });
      
  }


  async page_goto(){
    // await this.page.goto(this.url,{ waitUntil: 'networkidle0' });
      
    await Promise.all([this.page.waitForNavigation(), this.page.goto(this.url)]);
    // await Promise.race([
    //   this.page.goto(this.url).catch(e => void e),
    //   new Promise(x => setTimeout(x, 20 * 100))
    // ]);
    
  }
}


// #################################크롤러 종류 모음 #######################################//


class Mlb extends Crawling{
  
  async crawling(){
      const comments = await this.page.$$eval('.re_txt', comments => comments.map(comment => comment.innerText));
      return comments;
  }
}


class Ruli extends Crawling{
  
  async crawling(){
      const comments = await this.page.$$eval('.text', comments => comments.map(comment => comment.innerText));
      return comments;
  }
}

class Dc extends Crawling{
  
  async crawling(){
      const comments = await this.page.$$eval('.usertxt', comments => comments.map(comment => comment.innerText));
      return comments;
  }
}

class Hankook extends Crawling{
  
  async crawling(){
      const comments = await this.page.$$eval('.comment-box > .text', comments => comments.map(comment => comment.innerText));
      return comments;
  }
}

class Mbc extends Crawling{
  
  async crawling(){
      const comments = await this.page.$$eval('.user_text', comments => comments.map(comment => comment.innerText));
      return comments;
  }
}

class Kbs extends Crawling{
  
  async crawling(){
  
      const height = await this.page.evaluate(() => {
        return document.documentElement.scrollHeight;
      });
    
      await this.page.evaluate((height) => {
        window.scrollTo(0, height);
      }, height);
      const iframeElement = await this.page.$('#msg > div.reply > div > iframe');
      const iframe = await iframeElement.contentFrame();
      console.log(iframe, 'iframe');
      // await iframe.waitForNavigation();
      await iframe.waitForSelector('div.reply-content');
      while(1){
      try{
            await iframe.click('.more-btn');
            await iframe.waitForSelector('.more-btn', { timeout: 3000 });
         }catch{
            break;
         }
      }
      await iframe.waitForSelector('div.reply-content');
      const comments = await iframe.$$eval('div.reply-content > p', comments => comments.map(comment => comment.innerText));
      console.log(comments);
      return comments;
  }
  
}


class Snu extends Crawling{
  
  async crawling(){
      await this.page.waitForSelector('.user-name-and-created-at-container');
      const comments = await this.page.$$eval('.user-name-and-created-at-container', comments => comments.map(comment => comment.nextElementSibling.innerText));
      return comments;
  }
}

class EngHani extends Crawling{
  
  async crawling(){
      await this.page.waitForSelector('iframe[src^="https://www.facebook.com/plugins/comments.php"]');

      const iframeElement = await this.page.$('iframe[src^="https://www.facebook.com/plugins/comments.php"]');
      const iframe = await iframeElement.contentFrame({ waitUntil: "networkidle0" });
      await iframe.waitForSelector('.UFIImageBlockContent');
      let comments = await iframe.$$eval('.UFIImageBlockContent', comments => comments.map(comment => comment.innerText));
      comments.shift();
      comments=comments.map(comment=>comment.split("\n")[1]);
      return comments;
    }
}

// ################################ url convert class 딕셔너리 #######################################//

const classMap = {
  "24hz.kr": Mlb,
  "bbs.ruliweb.com":Ruli,
  "english.hani.co.kr":EngHani,
  "factcheck.snu.ac.kr":Snu,
  "gall.dcinside.com":Dc,
  "hankookilbo.com":Hankook,
  "imnews.imbc.com":Mbc,
  "mlbpark.donga.com":Mlb,
  "news.kbs.co.kr":Kbs,




  //"example.com": NBA,
  //"google.com": NFL
  // add more mappings here...
};



// ############################### 메인 코드 ############################//


module.exports.handler = async (event, context) => {

  let url;
  if(typeof event==='string'){
    url=event;
  }
  else{
    url=event["queryStringParameters"]["url"];
  }
  url=url.replace("%26","&");
  const words = url.split('/')[2];
  const ClassConstructor = classMap[words];

  let web=null;
  // Create an instance of the class constructor if it exists
  if (ClassConstructor) {
    web = new ClassConstructor(url);
    // do something with web...
  }else{
    const comments=[];
    return {
      statusCode: 204,
      body: JSON.stringify({
        message: comments
      })
    }
  }
  
  
  await web.chrome_on();
  await web.page_on();
  await web.page_goto();
  const comments = await web.crawling();
  await web.chrome_close();

  // setTimeout(() => chrome.instance.kill(), 0);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: comments
    })
  }

}
