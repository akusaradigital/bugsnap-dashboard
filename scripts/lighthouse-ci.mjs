import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const routes = ['http://127.0.0.1:3000/', 'http://127.0.0.1:3000/pricing'];

const chrome = await launch({ chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'] });
try {
  for (const url of routes) {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices'],
    });
    const { categories } = result.lhr;
    console.log(`Lighthouse ${url}`);
    console.log(JSON.stringify({
      performance: categories.performance.score,
      accessibility: categories.accessibility.score,
      bestPractices: categories['best-practices'].score,
    }, null, 2));
  }
} finally {
  await chrome.kill();
}
