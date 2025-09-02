from flask import Flask, render_template, jsonify, url_for
import json
import os

app = Flask(__name__)

# Main route to serve the HTML page
@app.route('/')
def index():
    return render_template('index.html')

# API route to serve the journey data
@app.route('/api/journey-data')
def get_journey_data():
    # Construct the full path to the JSON file
    json_path = os.path.join(app.static_folder, 'journeyData.json')
    # Open and load the JSON file
    #with open(json_path) as f:
    # Inside the get_journey_data function
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    # Return the data as a JSON response
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)