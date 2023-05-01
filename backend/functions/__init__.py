import os.path

import pymysql
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

basedir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__)

class Config:
    USERNAME = config.USERNAME
    PASSWORD = config.PASSWORD
    HOSTNAME = config.HOSTNAME
    PORT = config.PORT
    DATABASE = config.DATABASE
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://{}:{}@{}:{}/{}?charset=utf8'.format(
        USERNAME, PASSWORD, HOSTNAME, PORT, DATABASE
    )
    SECRET_KEY = config.SECRET_KEY

app.config.from_object(Config)

db = SQLAlchemy(app)
