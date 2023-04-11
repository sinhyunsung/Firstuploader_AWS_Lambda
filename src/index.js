const chromium = require('chrome-aws-lambda');

module.exports.handler = async (event, context) => {

  const browser = await chromium.puppeteer.launch({
    executablePath: await chromium.executablePath,
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    headless: chromium.headless,
  });

  const page = await browser.newPage();

  await browser.close();
  //// setTimeout(() => chrome.instance.kill(), 0);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello World!"
    })
  }

}