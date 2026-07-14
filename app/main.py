import os
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# In-memory data store for demo
characters = {}
boss = None

@app.route('/')
def index():
    return render_template('scene.html', characters=list(characters.values()), boss=boss)

@app.route('/api/characters', methods=['GET', 'POST'])
def api_characters():
    global boss
    if request.method == 'POST':
        data = request.json
        # Expects {"name": "", "soul": "", "model": ""}
        if data.get('role') == 'boss':
            boss = data
        else:
            characters[data['name']] = data
        return jsonify({'status': 'ok'}), 201
    else:
        return jsonify({'characters': list(characters.values()), 'boss': boss})

@app.route('/api/boss', methods=['PUT'])
def api_boss():
    global boss
    data = request.json
    boss = data
    return jsonify({'status': 'ok'}), 200

@app.route('/api/objects/:name', methods=['GET'])
# placeholder

def get_object(name):
    return jsonify({}), 200

if __name__ == '__main__':
    host = os.getenv('HOST', '127.0.0.1')
    port = int(os.getenv('PORT', 'OTTOM'))
    app.run(host=host, port=port, debug=True)
