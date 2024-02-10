import express from 'express'
import http from 'node:http'
import { createBareServer } from '@tomphttp/bare-server-node'
import path from 'node:path'
import cors from 'cors'
import { hostname } from "node:os"; 

var __dirname;  
var server;  
var app; 
var bareServer;

__dirname = process.cwd()
server = http.createServer()
app = express()
bareServer = createBareServer('/v/')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(express.static(path.join(__dirname, 'static')))

const routes = [
  { path: '/', file: 'index.html' },
  { path: '/~', file: 'apps.html' },
  { path: '/-', file: 'games.html' },
  { path: '/!', file: 'settings.html' },
  { path: '/0', file: 'tabs.html' },
  { path: '/&', file: 'go.html' },
  { path: '/e', file: 'now.html' },
]

const fetchData = async (req, res, next, baseUrl) => {
  try {
    const reqTarget = `${baseUrl}/${req.params[0]}`
    const asset = await fetch(reqTarget)

    if (asset.ok) {
      const data = await asset.arrayBuffer()
      res.end(Buffer.from(data))
    } else {
      next()
    }
  } catch (error) {
    console.error('Error fetching:', error)
    next(error)
  }
}

app.get('/y/*', cors({ origin: false }), (req, res, next) => {
  const baseUrl = 'https://raw.githubusercontent.com/ypxa/y/main'
  fetchData(req, res, next, baseUrl)
})

app.get('/f/*', cors({ origin: false }), (req, res, next) => {
  const baseUrl = 'https://raw.githubusercontent.com/4x-a/x/fixy'
  fetchData(req, res, next, baseUrl)
})

routes.forEach((route) => {
  app.get(route.path, (req, res) => {
    res.sendFile(path.join(__dirname, 'static', route.file))
  })
})

server.on('request', (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res)
  } else {
    app(req, res)
  }
})

server.on('upgrade', (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head)
  } else {
    socket.end()
  }
})

let port = parseInt(process.env.PORT || "");

if (isNaN(port)) port = 8080;

server.on("listening", () => {
  const address = server.address();

  // by default we are listening on 0.0.0.0 (every interface)
  // we just need to list a few
  console.log("Listening on:");
  console.log(`\thttp://localhost:${address.port}`);
  console.log(`\thttp://${hostname()}:${address.port}`);
  console.log(
    `\thttp://${
      address.family === "IPv6" ? `[${address.address}]` : address.address
    }:${address.port}`
  );
});

// https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

function shutdown() {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
}

server.listen({
  port,
});
