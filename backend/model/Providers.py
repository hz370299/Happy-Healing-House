from functions import db

class Providers(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(64))
    date_of_birth = db.Column(db.Date)
