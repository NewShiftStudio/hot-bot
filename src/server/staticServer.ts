import * as fs from 'node:fs';
import { ReadStream } from 'node:fs';
import * as http from 'node:http';
import * as path from 'node:path';
import { toBool } from '../helpers/toBool';

const PORT = process.env.STATIC_SERVER_PORT;

type FileTypes =
  | 'html'
  | 'js'
  | 'css'
  | 'png'
  | 'jpg'
  | 'gif'
  | 'ico'
  | 'svg'
  | 'zip';

type CustomFile = {
  found: boolean;
  ext: FileTypes;
  stream: ReadStream;
};

const MIME_TYPES: Record<FileTypes | 'default', string> = {
  default: 'application/octet-stream',
  html: 'text/html; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  css: 'text/css',
  png: 'image/png',
  jpg: 'image/jpg',
  gif: 'image/gif',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
  zip: 'application/zip',
};

const STATIC_PATH = path.join(process.cwd(), './static');
const SERVER_TIMEOUT = 10000; // 10s

const prepareFile = async (url: string): Promise<CustomFile> => {
  const paths = [STATIC_PATH, url];
  if (url.endsWith('/')) paths.push('index.html');
  const filePath = path.join(...paths);
  const pathTraversal = !filePath.startsWith(STATIC_PATH);
  const exists = await fs.promises.access(filePath).then(...toBool);
  const found = !pathTraversal && exists;
  const streamPath = found ? filePath : STATIC_PATH + '/404.html';
  const ext = path.extname(streamPath).substring(1).toLowerCase() as FileTypes;
  const stream = fs.createReadStream(streamPath);
  return { found, ext, stream };
};

export const launchStaticServer = async () => {
  const server = http
    .createServer(async (req, res) => {
      const file = await prepareFile(req.url || '');
      const statusCode = file.found ? 200 : 404;
      const mimeType = MIME_TYPES[file.ext] || MIME_TYPES.default;
      res.writeHead(statusCode, { 'Content-Type': mimeType });
      file.stream.pipe(res);
      console.info(`${req.method} ${req.url} ${statusCode}`);
    })
    .listen(PORT);

  return new Promise((resolve, reject) => {
    server.on('listening', resolve);
    server.on('error', (err) => reject(`Server error: ${err.message}`));
    setTimeout(() => reject('Timeout error'), SERVER_TIMEOUT);
  });
};
