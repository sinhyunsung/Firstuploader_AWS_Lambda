const chromium = require('chrome-aws-lambda');


class Crawling{
  constructor(url) {
    this.url=url;
    this.browser;
    this.page;
  }

  async chrome_on(){
    const minimal_args = [
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
      '--disable-sync',
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
    ];

    this.browser = await chromium.puppeteer.launch({
      executablePath: await chromium.executablePath,
      args: minimal_args,
      defaultViewport: chromium.defaultViewport,
      headless: true,
    });
  }
  
  async chrome_close(){  
    await this.browser.close();
  }

  async page_on(){
    this.page = await this.browser.newPage(); 
    
      const blockResource = [
        'image', 
        'script', 
        'stylesheet', 
        'xhr', 
        'font', 
        'other'
      ];

      await this.page.setRequestInterception(true);

      this.page.on('request', req => {
        // 리소스 유형
        const resource = req.resourceType(); 
        if (blockResource.indexOf(resource) !== -1) {
          req.abort();  // 리소스 막기
        } else {
          req.continue(); // 리소스 허용하기
        }
      });
  }

  async page_goto(){
    await this.page.goto(this.url);
  }
}


// #################################크롤러 종류 모음 #######################################//


class Mlb extends Crawling{
  
  async crawling(){
      const comments = await this.page.$$eval('.re_txt', comments => comments.map(comment => comment.innerText));
      return comments;
  }
}



// ################################ url convert class 딕셔너리 #######################################//

const classMap = {
  "24hz.kr": Mlb,
  //"example.com": NBA,
  //"google.com": NFL
  // add more mappings here...
};



// ############################### 메인 코드 ############################//


module.exports.handler = async (event, context) => {

  
  const url= event[queryStringParameters][url];
  const words = url.split('/')[2];
  const ClassConstructor = classMap[words];

  let web=null;
  // Create an instance of the class constructor if it exists
  if (ClassConstructor) {
    web = new ClassConstructor(url);
    // do something with web...
  }else{
    return {
      statusCode: 403,
      message: "데이터에 없는 url 입니다. ("+words+")"
    }
  }
  
  
  await web.chrome_on();
  await web.page_on();
  await web.page_goto();
  const comments = await web.crawling();
  await web.chrome_close();

  //setTimeout(() => chrome.instance.kill(), 0);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: comments,
    })
  }



}

