self.importScripts("https://www.unpkg.com/xhr-shim@0.1.3/src/index.js")
self.XMLHttpRequest = self.XMLHttpRequestShim;
console.log(self.XMLHttpRequestShim);
self.importScripts("https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js")
self.importScripts("https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.asm.js")


let _pyodide;
let _flaskReady = false;

async function getPyodide() {
  if (!_pyodide) {
    _pyodide = await loadPyodide()
    await initFlask()
  }
  return _pyodide;
}

self.addEventListener("activate", (event) => {
  console.log("activate is called!")
  let pyodideLoadingPromise = loadPyodide()
    .then(p => {
      _pyodide = p;
      return initFlask()
    })

  event.waitUntil(pyodideLoadingPromise);
  event.waitUntil(clients.claim());
  event.waitUntil((async function(){
    console.log("Sended message!")
    const client = await clients.get(event.clientId);
    if(!client) return;
    client.postMessage({type: "activateReady"})
  })())
  console.log("clients.claim(): Ansonsten würde der fetch-intercept erst nach einem Reload der Seite funktionieren");

});

self.addEventListener('message', async function (event) {
  console.log(event.data);
});

async function sleep(msec) {
  return new Promise(resolve => setTimeout(resolve, msec));
}
function wsgiResult2JsResponse(result) {
  let status = result.get("status").split(" ", 2);

  return new Response(result.get("result"), {
    headers: result.get("header"),
    status: parseInt(status[0]),
    statusText: status[1]
  });
}
async function processRequest(request) {
  let call = await jsRequest2wsgiCall(request);
  let result = (await executeQuery(call)).toJs();
  console.log("result", result);
  let response = wsgiResult2JsResponse(result);
  console.log("response", response);
  return response;
};

self.addEventListener("fetch", event =>  {
  console.log("fetch-event wurde abgefangen", event);

  event.respondWith(processRequest(event.request));


  // if (event.request.url.includes("calculateBMI")) {
  //   let params = new URL(event.request.url).searchParams;
  //
  //   let height = Number.parseFloat(params.get("height"));
  //   let weight = Number.parseFloat(params.get("weight"));
  //
  //   let result = pyodide.runPython(`(${height}/1000)**2 * ${weight}`);
  //
  //   event.respondWith(new Response(result + "kg/m²"));
  //
  // }



});

async function jsRequest2wsgiCall(request) {
  let url = new URL(request.url)

  let wsgiCall = {
    "REQUEST_METHOD": request.method,
    "SCRIPT_NAME": "python", //virtual location of the server
    "PATH_INFO": url.pathname,
    "QUERY_STRING": url.search.substring(1), //remove '?'-prefix
    "SERVER_NAME": "service-worker",
    "SERVER_PROTOCOL": "HTTP/1.1",
    "wsgi.url_scheme": "http",
  }
  if(request.method === "POST") {
    let body = await request.text();
    console.log({body})
    wsgiCall["wsgi.input"] = body;
  }
  if (request.headers.has("Content-Type")) {
    wsgiCall["CONTENT_TYPE"] = request.headers.get("Content-Type");
  }
  if (request.headers.has("Content-Length")) {
    wsgiCall["CONTENT_LENGTH"] = request.headers.get("Content-Length");
  }
  //TODO: Handle other headers
  console.log("headers", request.headers);
  return wsgiCall;
}

async function initFlask() {
  await _pyodide.loadPackage("micropip");
  const micropip = _pyodide.pyimport("micropip");
  await micropip.install('Flask');
  _pyodide.unpackArchive(await (await fetch("myzipfile.zip", {cache: "no-store"})).arrayBuffer(), "zip");
  _pyodide.runPython(`
import os
start_path = '.'
for path,dirs,files in os.walk(start_path):
    for filename in files:
        print(os.path.join(path,filename))

import importlib
importlib.invalidate_caches()

print("Hallo Welt")

os.environ["FLASK_ENV"] = "development"
os.environ["FLASK_DEBUG"] = "1"
from app import app

print(app)
  `)

  console.log("initFlask is finished!")
  _flaskReady = true;
}

async function executeQuery(wsgiRequest){
  return (await getPyodide()).runPython(`
import io

status = None
header = None

def start_response(_status, _header):
   global status
   status = _status
   global header
   header = _header

req = ${JSON.stringify(wsgiRequest)}

if 'wsgi.input' in req:
  bytes = req['wsgi.input'].encode('utf-8')
  req["CONTENT_LENGTH"] = str(len(bytes))  # Is required by Flask smhw. Must be str.
  req['wsgi.input'] = io.BytesIO(bytes)

print(req)
res = app.wsgi_app(req, start_response)

{"status":status,"header":header,"result":b"".join(res).decode("utf-8")}
`);

}
