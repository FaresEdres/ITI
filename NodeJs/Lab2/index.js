import http from 'node:http';
import {resources} from './resources.js';
import {
  serveDocumentaryPage,
  serveDownloadPage,
  serveEmployeePage,
  serveImage,
  serveRootRequest,
  serveStyleSheet,
  submitNewEmployee
} from './utils.js';

const server = http.createServer((req, res) => {
  const {method: reqMethod, url: reqUrl} = req;

  if (reqMethod === 'POST') {
    if (reqUrl === '/submitNewEmployee') {
      submitNewEmployee(res, req);
    } else if (reqUrl === resources.downloadPage.route) {
      serveDownloadPage(res);
    } else {
      res.writeHead(404, {'Content-Type': resources.notFoundPage.contentType});
      res.end('404 page not found');
    }
  } else if (reqMethod === 'GET') {
    if (reqUrl === resources.rootPage.route) {
      serveRootRequest(res);
    } else if (reqUrl === resources.database.route) {
      serveDownloadPage(res);
    } else if (reqUrl === resources.serbalImage.route) {
      serveImage(
        res,
        resources.serbalImage.path,
        resources.serbalImage.contentType
      );
    } else if (reqUrl === resources.serbalPage.route) {
      const title = 'Serbal';
      const imagePath = resources.serbalImage.path;
      const description
        = 'The sun rises from behind distant peaks, casting a golden glow over the rocky terrain. The foreground features smooth, weathered boulders, with a carefully arranged pattern of small stones on the surface.';
      serveDocumentaryPage(res, title, imagePath, description);
    } else if (reqUrl === resources.css.route) {
      serveStyleSheet(res);
    } else if (reqUrl === resources.downloadPage.route) {
      serveDownloadPage(res);
    } else if (reqUrl === resources.astronomyPage.route) {
      const title = 'Astronomy';
      const imagePath = resources.astronomyImage.path;
      const description
        = ' This image showcases a breathtaking night sky filled with countless stars, including the vibrant, cloudy structure of the Milky Way galaxy stretching across the frame. Below, there are adobe-style buildings with smooth, curved surfaces, likely made of mud or clay, blending seamlessly into the desert-like landscape. The structures are softly illuminated, possibly by moonlight or artificial lighting, adding a subtle contrast against the vast, dark sky. The scene evokes a sense of solitude and wonder, highlighting the beauty of both nature and ancient human architecture under the cosmos.';
      serveDocumentaryPage(res, title, imagePath, description);
    } else if (reqUrl === '/employee') {
      serveEmployeePage(res);
    } else if (reqUrl === resources.astronomyImage.route) {
      serveImage(
        res,
        resources.astronomyImage.path,
        resources.astronomyImage.contentType
      );
    } else {
      res.writeHead(404, {'Content-Type': resources.notFoundPage.contentType});
      res.end('404 page not found');
    }
  } else {
    res.writeHead(405, {'Content-Type': 'text/html'});
    res.end('Method Not Allowed');
  }
});

server.listen(3000, () => {
  console.log('Server is running => port 3000');
});
