import fs from 'node:fs';
import {Transform} from 'node:stream';

import streamChain from 'stream-chain';
import streamJsonParser from 'stream-json';
import streamJsonDisassembler from 'stream-json/Disassembler.js';
import streamJsonArray from 'stream-json/streamers/StreamArray.js';
import streamJsonStringer from 'stream-json/Stringer.js';

import {resources} from './resources.js';

const {chain} = streamChain;
const {parser} = streamJsonParser;
const {disassembler} = streamJsonDisassembler;
const {streamArray} = streamJsonArray;
const {stringer} = streamJsonStringer;

export {
  addEmployee,
  serveAstronomyPage,
  serveDocumentaryPage,
  serveDownloadPage,
  serveEmployeePage,
  serveImage,
  serveRootRequest,
  serveStyleSheet,
  submitNewEmployee
};

function addEmployee(res, employee) {
  try {
    let employees = JSON.parse(fs.readFileSync('./database.json', 'utf-8'));
    const nameRegex = /^[a-z]+$/i;
    employee.id = (employees.slice(-1)[0]?.id ?? 0) + 1;
    console.log(employee.name.length);
    if (employee.name.length <= 2) {
      throw new Error('Name size should be greater than 2');
    }
    if (!nameRegex.test(employee.name)) {
      throw new Error('Name should be alphabets only');
    }
    employees = employees.concat(employee);
    fs.writeFileSync('./database.json', JSON.stringify(employees, '', 2));
  } catch (err) {
    console.error('Error in addEmployee:', err);

    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('Internal Server Error');
  }
}
function serveImage(res, imagePath, imageType) {
  try {
    console.log(imagePath);

    res.writeHead(200, {'Content-type': imageType});
    const imageStream = fs.createReadStream(imagePath);
    imageStream.pipe(res);
  } catch (err) {
    console.error('Error in serveImage:', err);
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('Internal Server Error');
  }
}

function serveDocumentaryPage(res, title, imagePath, description) {
  try {
    const transformHtml = new Transform({
      transform(chunk, encoding, callback) {
        const modifiedChunk = chunk
          .toString()
          .replace('{imageTitle}', title)
          .replace('{image}', `<img src="${imagePath}">`)
          .replace('{imageDescription}', description);
        callback(null, modifiedChunk);
      }
    });
    res.writeHead(200, {'Content-Type': 'text/html'});
    fs.createReadStream('./documentary.html').pipe(transformHtml).pipe(res);
  } catch (err) {
    console.error('Error in serveSerbalPage:', err);
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('Internal Server Error');
  }
}
function serveStyleSheet(res) {
  try {
    res.writeHead(200, {'Content-Type': resources.css.contentType});
    const cssStream = fs.createReadStream(resources.css.path);
    cssStream.pipe(res);
  } catch (err) {
    console.error('Error in serveStyleSheet:', err);
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('Internal Server Error');
  }
}

function serveDownloadPage(res) {
  try {
    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'content-Disposition': 'attachment; filename="./assets/astronomy.jpg"'
    });
    res.end();
  } catch (err) {
    console.error('Error in serveDownloadPage:', err);
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('Internal Server Error');
  }
}

function serveAstronomyPage(res) {
  try {
    const transformHtml = new Transform({
      transform(chunk, encoding, callback) {
        const modifiedChunk = chunk
          .toString()
          .replace('{imageTitle}', 'Astronomy')
          .replace('{image}', `<img src="${resources.astronomyImage.path}" >`)
          .replace();
        callback(null, modifiedChunk);
      }
    });

    res.writeHead(200, {'Content-Type': 'text/html'});
    fs.createReadStream('./documentary.html').pipe(transformHtml).pipe(res);
  } catch (err) {
    console.error('Error in serveAstronomyPage:', err);
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('Internal Server Error');
  }
}
function serveRootRequest(res) {
  try {
    res.writeHead(200, {'Content-Type': resources.rootPage.contentType});
    let body = '';
    const fileStream = fs.createReadStream(resources.database.path);
    body += ` <h1>Company Data</h1>
        <table style="border: 5px solid black; border-collapse: collapse;">`;

    let headerWritten = false;
    /** ***Stream-Chain */
    const filteredData = chain([
      fileStream,
      parser(),
      streamArray(),
      (data) => {
        const {id, ...rest} = data.value;
        body += `<tr>`;
        if (!headerWritten) {
          headerWritten = true;
          for (const [key] of Object.entries(rest)) {
            body += `<th>${key}</th>`;
          }
        }
        body += `</tr>`;
        body += `<tr>`;

        for (const [, value] of Object.entries(rest)) {
          body += `<td>${value}</td>`;
        }
        body += `</tr>`;
      },
      disassembler(),
      stringer()
    ]);

    filteredData.pipe(res, {end: false});

    filteredData.on('end', () => {
      body += `</table>`;
      /** ***Transform */
      const transformHtml = new Transform({
        transform(chunk, encoding, callback) {
          const modifiedChunk = chunk
            .toString()
            .replace('{employeeCard}', body);
          callback(null, modifiedChunk);
        }
      });
      fs.createReadStream('index.html').pipe(transformHtml).pipe(res);
    });
  } catch (err) {
    console.error('Error in serveRootRequest:', err);
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('Internal Server Error');
  }
}
function submitNewEmployee(res, req) {
  try {
    res.writeHead(200, {'content-type': 'text/html'});
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      const formData = new URLSearchParams(body);
      const parsedFormData = Object.fromEntries(formData);
      addEmployee(res, parsedFormData);
      res.write('Employee has been added successfully');
    });
  } catch (err) {
    console.error('Error in submitNewEmployee:', err);
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('Internal Server Error');
  }
}
function serveEmployeePage(res) {
  try {
    res.writeHead(200, {'content-type': 'text/html'});
    fs.createReadStream('./employeeForm.html').pipe(res);
  } catch (err) {
    console.error('Error in serveEmployeePage:', err);
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('Internal Server Error');
  }
}
