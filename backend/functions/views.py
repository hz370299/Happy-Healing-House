from flask import Flask, Blueprint, render_template, session, redirect, url_for, request, jsonify
from . import app
import json
from model.Providers import Providers
from model.Patients import Patients
# from flask_cors import CORS
from flask_cors import cross_origin
# CORS(functions)

@app.route('/')
def hello_world():  # put application's code here
    return 'Hello World!'

@app.route("/check", methods = ["POST"])
@cross_origin()
def check_exist():

    exist_response = json.dumps({"exist": True})
    not_exist_response = json.dumps({"exist": False})

    if request.method == "POST":
        body = request.data
        json_object = json.loads(body)
        
        if json_object['role'] == 'Patient' or json_object['role'] == 'PatientCompanion':
            rows = Patients.query.filter(Patients.name == json_object['name'], Patients.date_of_birth == json_object['dob'])
            if rows.count() > 0:
                return exist_response, 200
            else:
                return not_exist_response, 400

        elif json_object['role'] == 'Nurse/Doctor':
            rows = Providers.query.filter(Providers.name == json_object['name'], Providers.date_of_birth == json_object['dob'])
            if rows.count() > 0:
                return exist_response, 200
            else:
                return not_exist_response, 400

        else:
            rows1 = Providers.query.filter(Providers.name == json_object['name'], Providers.date_of_birth == json_object['dob'])
            if rows1.count() > 0:
                return exist_response
            rows2 = Patients.query.filter(Patients.name == json_object['name'], Patients.date_of_birth == json_object['dob'])
            if rows2.count() > 0:
                return exist_response, 200
            else:
                return not_exist_response, 400
