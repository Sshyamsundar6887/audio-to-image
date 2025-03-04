from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from openai import OpenAI
import os
import warnings
import time
from PIL import Image
import requests
from io import BytesIO
import urllib.parse
import uuid
import base64
from datetime import datetime
from werkzeug.utils import secure_filename
import json
from dotenv import load_dotenv
import httpx

# Load environment variables
load_dotenv()

# Suppress warnings
warnings.filterwarnings("ignore")

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key")
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL", "sqlite:///images.db")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize database
db = SQLAlchemy(app)

# Set API key and initialize OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")

# Configure HTTPX client with proxy settings if needed
http_client = httpx.Client(
    proxies=os.getenv("HTTPS_PROXY"),  # Use the HTTPS_PROXY environment variable if set
    verify=False  # Disable SSL verification if needed
)

# Initialize OpenAI client with the configured HTTPX client
client = OpenAI(
    api_key=openai_api_key,
    http_client=http_client
)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    generations = db.relationship('Generation', backref='user', lazy=True)

class Generation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    transcription = db.Column(db.Text, nullable=True)
    dalle_prompt = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    local_image_path = db.Column(db.String(500), nullable=True)
    style = db.Column(db.String(50), default="vivid")
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# Helper Functions
def get_or_create_user():
    if 'user_session_id' not in session:
        session['user_session_id'] = str(uuid.uuid4())
    
    user = User.query.filter_by(session_id=session['user_session_id']).first()
    if not user:
        user = User(session_id=session['user_session_id'])
        db.session.add(user)
        db.session.commit()
    
    return user

def chatgpt_api(input_text):
    if not input_text:
        return "No input text provided."
    
    messages = [
        {"role": "system", "content": "You are a helpful assistant specialized in creating vivid, detailed DALL-E prompts. Make the prompt visually descriptive."},
        {"role": "user", "content": f'Transform this description: "{input_text}" into a detailed DALL-E prompt that will create a stunning image.'}
    ]
    
    # Updated for OpenAI v1.0+
    chat_completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages
    )

    reply = chat_completion.choices[0].message.content
    return reply

def dall_e_api(dalle_prompt, style="vivid"):
    if not dalle_prompt:
        return None
    
    try:
        # Updated for OpenAI v1.0+
        dalle_response = client.images.generate(
            prompt=dalle_prompt,
            model="dall-e-3",
            size="1024x1024",
            quality="hd",
            style=style,
            n=1
        )
        image_url = dalle_response.data[0].url
        return image_url
    except Exception as e:
        print(f"Error generating image: {str(e)}")
        return None

def save_image_locally(image_url):
    try:
        response = requests.get(image_url)
        img = Image.open(BytesIO(response.content))
        
        # Create a unique filename
        filename = f"image_{uuid.uuid4()}.png"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Save the image
        img.save(filepath)
        
        # Return the relative path for database storage with forward slashes
        return 'uploads/' + filename
    except Exception as e:
        print(f"Error saving image: {str(e)}")
        return None

def transcribe_audio(audio_file):
    try:
        # Updated for OpenAI v1.0+
        with open(audio_file, "rb") as file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                language='en',
                file=file
            )
        return transcript.text
    except Exception as e:
        print(f"Error transcribing audio: {str(e)}")
        return None

# Routes
@app.route('/')
def index():
    # Ensure user exists in database
    user = get_or_create_user()
    return render_template('index.html')

@app.route('/api/transcribe', methods=['POST'])
def api_transcribe():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({'error': 'No audio file selected'}), 400
    
    # Save the uploaded file temporarily
    temp_filename = f"temp_audio_{uuid.uuid4()}.wav"
    temp_path = os.path.join(app.config['UPLOAD_FOLDER'], temp_filename)
    audio_file.save(temp_path)
    
    # Transcribe the audio
    transcription = transcribe_audio(temp_path)
    
    # Clean up the temporary file
    try:
        os.remove(temp_path)
    except:
        pass
    
    if not transcription:
        return jsonify({'error': 'Failed to transcribe audio'}), 500
    
    return jsonify({'transcription': transcription})

@app.route('/api/generate-image', methods=['POST'])
def api_generate_image():
    data = request.json
    
    if not data or ('text' not in data and 'transcription' not in data):
        return jsonify({'error': 'No text provided'}), 400
    
    # Get the input text (either direct text or transcription)
    input_text = data.get('text', data.get('transcription', ''))
    style = data.get('style', 'vivid')
    
    # Generate DALL-E prompt
    dalle_prompt = chatgpt_api(input_text)
    
    # Generate image
    image_url = dall_e_api(dalle_prompt, style)
    
    if not image_url:
        return jsonify({'error': 'Failed to generate image'}), 500
    
    # Save image locally
    local_path = save_image_locally(image_url)
    
    # Save to database
    user = get_or_create_user()
    generation = Generation(
        user_id=user.id,
        transcription=input_text,
        dalle_prompt=dalle_prompt,
        image_url=image_url,
        local_image_path=local_path,
        style=style
    )
    db.session.add(generation)
    db.session.commit()
    
    return jsonify({
        'transcription': input_text,
        'dalle_prompt': dalle_prompt,
        'image_url': image_url,
        'local_image_path': '/static/' + local_path if local_path else None,
        'id': generation.id
    })

@app.route('/api/history')
def api_history():
    user = get_or_create_user()
    generations = Generation.query.filter_by(user_id=user.id).order_by(Generation.timestamp.desc()).all()
    
    history = []
    for gen in generations:
        history.append({
            'id': gen.id,
            'transcription': gen.transcription,
            'dalle_prompt': gen.dalle_prompt,
            'image_url': gen.image_url,
            'local_image_path': '/static/' + gen.local_image_path if gen.local_image_path else None,
            'style': gen.style,
            'timestamp': gen.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    return jsonify({'history': history})

@app.route('/api/download/<int:generation_id>')
def api_download(generation_id):
    generation = Generation.query.get_or_404(generation_id)
    
    # Check if user owns this generation
    user = get_or_create_user()
    if generation.user_id != user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    if not generation.local_image_path:
        return jsonify({'error': 'Image not found locally'}), 404
    
    return jsonify({
        'download_url': '/static/' + generation.local_image_path
    })

@app.route('/api/share/<int:generation_id>')
def api_share(generation_id):
    generation = Generation.query.get_or_404(generation_id)
    
    # Check if user owns this generation
    user = get_or_create_user()
    if generation.user_id != user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Create WhatsApp sharing URL
    if generation.image_url:
        encoded_url = urllib.parse.quote(generation.image_url)
        whatsapp_url = f"https://api.whatsapp.com/send?text=Check%20out%20this%20AI-generated%20image:%20{encoded_url}"
        return jsonify({'share_url': whatsapp_url})
    
    return jsonify({'error': 'No image URL available'}), 404

# Create database tables
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)