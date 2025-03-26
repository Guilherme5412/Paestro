from flask import Flask

app = Flask(__name__)

# Carrega configurações
app.config.from_object('config')

# Importa as rotas diretamente 
from .app import *