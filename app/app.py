from flask import Flask
from flask import request
from flask import render_template

print("name is ", __name__)
app = Flask(__name__)

@app.route('/')
def index():
   return 'Hello World!'

@app.route('/john')
def hello_john():
   return 'Hello John!'

@app.route('/foo', methods=['POST'])
def foo():
    data = request.json
    print("data="+str(data))
    return "Antwort!"

@app.route('/calculateBMI')
def bmi():
   height = request.args.get('height', default=1, type=int)
   weight = request.args.get('weight', default=1, type=int)
   return str(height*weight)

@app.route('/template')
def template():
   return render_template("base.html")

print(app.url_map)
