import json
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import uuid

app = Flask(__name__)
# diretório do projeto (um nível acima de backend/)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# arquivo de banco de dados centralizado em /database/pessoas.json
DB_FILE = os.path.join(PROJECT_ROOT, 'database', 'pessoas.json')
CORS(app)

def carregar_pessoas():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def salvar_pessoas(pessoas):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(pessoas, f, ensure_ascii=False, indent=2)

@app.route('/login', methods=['POST'])
def login():
    dados = request.json or {}
    email = (dados.get('email') or '').strip().lower()
    senha = dados.get('senha') or ''
    pessoas = carregar_pessoas()

    print(f"[DEBUG] Tentativa login: email='{email}', total_pessoas={len(pessoas)}")
    pessoa = next((p for p in pessoas if (p.get('email') or '').lower() == email), None)
    if not pessoa:
        print("[DEBUG] Usuário não encontrado")
        return jsonify({'success': False, 'message': 'Usuário ou senha incorretos'}), 401

    senha_hash = pessoa.get('senha_hash', '')
    print(f"[DEBUG] Usuário encontrado: nome='{pessoa.get('nome')}', tem_hash={'sim' if senha_hash else 'não'}")

    ok = False
    try:
        ok = check_password_hash(senha_hash, senha)
    except Exception as e:
        print("[DEBUG] Erro check_password_hash:", e)

    # fallback se registro antigo tiver senha em texto plano
    if not ok and 'senha' in pessoa:
        if pessoa.get('senha') == senha:
            ok = True
            print("[DEBUG] Fallback: senha em texto plano bateu")

    if not ok:
        print("[DEBUG] Senha inválida")
        return jsonify({'success': False, 'message': 'Usuário ou senha incorretos'}), 401

    print("[DEBUG] Login OK para:", pessoa.get('email'))
    return jsonify({
        'success': True,
        'tipo': pessoa['tipo'],
        'especialidade': pessoa.get('especialidade', ''),
        'nome': pessoa.get('nome', ''),
        'email': pessoa.get('email', '')
    })

@app.route('/registrar', methods=['POST'])
def registrar_pessoa():
    pessoas = carregar_pessoas()
    dados = request.json
    nome = (dados.get('nome') or '').strip()
    email = (dados.get('email') or '').strip().lower()
    tipo = dados.get('tipo')
    especialidade = dados.get('especialidade') if tipo == 'medico' else None
    senha = dados.get('senha')

    if tipo not in ['medico', 'cliente']:
        return jsonify({'erro': 'Tipo inválido'}), 400
    if not senha or not email or not nome:
        return jsonify({'erro': 'Nome, email e senha são obrigatórios'}), 400
    if any(p.get('email', '').lower() == email for p in pessoas):
        return jsonify({'erro': 'E-mail já cadastrado'}), 400

    # força algoritmo padrão
    senha_hash = generate_password_hash(senha, method='pbkdf2:sha256')
    pessoa = {
        'nome': nome,
        'email': email,
        'tipo': tipo,
        'especialidade': especialidade,
        'senha_hash': senha_hash
    }
    pessoas.append(pessoa)
    salvar_pessoas(pessoas)
    return jsonify({'mensagem': 'Pessoa registrada com sucesso!', 'pessoa': pessoa}), 201

@app.route('/pessoas', methods=['GET'])
def listar_pessoas():
    pessoas = carregar_pessoas()
    return jsonify(pessoas)


# Servir arquivos estáticos do front-end (pasta public no root do projeto)
@app.route('/')
def index():
    public_dir = os.path.join(PROJECT_ROOT, 'public')
    return send_from_directory(public_dir, 'index.html')


@app.route('/<path:path>')
def static_files(path):
    public_dir = os.path.join(PROJECT_ROOT, 'public')
    return send_from_directory(public_dir, path)


# Diretório de uploads (para fotos dos usuários) — pasta compartilhada no projeto root
UPLOAD_DIR = os.path.join(PROJECT_ROOT, 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXT = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXT


@app.route('/upload_foto', methods=['POST'])
def upload_foto():
    # Espera campos: form 'email' e file 'foto'
    if 'foto' not in request.files:
        return jsonify({'erro': 'Campo "foto" não enviado'}), 400
    file = request.files['foto']
    email = (request.form.get('email') or '').strip().lower()
    if not email:
        return jsonify({'erro': 'Campo "email" é obrigatório'}), 400
    if file.filename == '':
        return jsonify({'erro': 'Nenhum arquivo selecionado'}), 400
    if not allowed_file(file.filename):
        return jsonify({'erro': 'Tipo de arquivo não permitido'}), 400

    # salvar com nome único
    ext = os.path.splitext(secure_filename(file.filename))[1]
    newname = f"{uuid.uuid4().hex}{ext}"
    destino = os.path.join(UPLOAD_DIR, newname)
    file.save(destino)

    # atualizar registro da pessoa
    pessoas = carregar_pessoas()
    pessoa = next((p for p in pessoas if (p.get('email') or '').lower() == email), None)
    if not pessoa:
        # remover arquivo salvo se usuário não encontrado
        try:
            os.remove(destino)
        except Exception:
            pass
        return jsonify({'erro': 'Pessoa não encontrada'}), 404

    # remover foto antiga (se estiver no diretório uploads)
    old = pessoa.get('foto')
    if old and old.startswith('/uploads/'):
        # antigo código usava BASE_DIR (backend/); o uploads está em PROJECT_ROOT/uploads
        oldpath = os.path.join(PROJECT_ROOT, old.lstrip('/\\'))
        if os.path.exists(oldpath):
            try:
                os.remove(oldpath)
            except Exception:
                pass

    pessoa['foto'] = f"/uploads/{newname}"
    try:
        salvar_pessoas(pessoas)
    except Exception as e:
        # se falhar ao salvar, remover arquivo recém gravado para não deixar lixo
        try:
            os.remove(destino)
        except Exception:
            pass
        print('[ERROR] Falha ao salvar pessoas.json:', e)
        return jsonify({'erro': 'Falha ao salvar dados'}), 500

    print(f"[DEBUG] upload_foto: email={email}, saved={destino}, registro_atualizado={pessoa.get('email')}")
    return jsonify({'sucesso': True, 'foto': pessoa['foto']})


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_DIR, filename)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
    
