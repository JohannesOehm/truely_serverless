# Truely serverless

Run your web application in the clients webbrowser - using [Pyodide](https://pyodide.org/en/stable/) and [service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API).

## What does this do?
This project registers a Service Worker, which intercepts all requests and handles them inside the browser. Therefore, it
uses the [WSGI](https://wsgi.readthedocs.io/en/latest/what.html) interface.

## WORK IN PROGESS - What works?
* Basic handling of GET and POST requests

## What does not work
* Flask templates


