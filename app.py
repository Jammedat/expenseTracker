from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_mysqldb import MySQL
from termcolor import colored
import MySQLdb.cursors
import bcrypt
# import mysql.connector
# import pymysql.cursors as MySQLdb

import re
import os

# export FLASK_SECRET_KEY=your_secret_key
# export MYSQL_PASSWORD=os.getenv('MYSQL_PASSWORD')
# export MYSQL_DB=your_database_name


app = Flask(__name__)
 
 
app.secret_key = 'appkosecretkey' #appkosecret
 
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD')
app.config['MYSQL_DB'] = 'explogin'
mysql = MySQL(app)
 
@app.route('/')
@app.route('/login', methods =['GET', 'POST'])
def login():
    msg = ''
    if request.method == 'POST' and 'username' in request.form and 'password' in request.form:
        username = request.form['username']
        password = request.form['password']
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM accounts WHERE username = % s', (username, ))
        account = cursor.fetchone()
        
        if account and bcrypt.checkpw(password.encode('utf-8'), account['password'].encode('utf-8')):
        # if account:
            session['loggedin'] = True
            session['id'] = account['id']
            session['username'] = account['username']
            msg = 'Logged in successfully!'
            return render_template('in.html', username=session['username'], avatar_url="static/user.png", msg = msg)
        else:
            msg = 'Incorrect username / password!'
    return render_template('login.html',  msg = msg)
 
@app.route('/logout')
def logout():
    session.pop('loggedin', None)
    session.pop('id', None)
    session.pop('username', None)
    return redirect(url_for('login'))
 
@app.route('/register', methods =['GET', 'POST'])
def register():
    msg = ''
    if request.method == 'POST' and 'username' in request.form and 'password' in request.form and 'email' in request.form :
        username = request.form['username']
        password = request.form['password']
        email = request.form['email']
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM accounts WHERE username = % s', (username, ))
        account = cursor.fetchone()
        if account:
            msg = 'Account already exists!'
        elif not re.match(r'[^@]+@[^@]+\.[^@]+', email):
            msg = 'Invalid email address!'
        elif not re.match(r'[A-Za-z0-9]+', username):
            msg = 'Username must contain only characters and numbers!'
        elif not username or not password or not email:
            msg = 'Please fill out the form!'
        else:
            cursor.execute('INSERT INTO accounts VALUES (NULL, % s, % s, % s)', (username, hashed_password, email, ))
            mysql.connection.commit()
            cursor.execute('SELECT LAST_INSERT_ID()')
            last_id = cursor.fetchone()['LAST_INSERT_ID()']
            session['loggedin'] = True
            session['id'] = last_id
            session['username'] = username
            msg = 'You have successfully registered!'
            return render_template('in.html', username=session['username'], avatar_url="static/user.png", msg = msg)
    elif request.method == 'POST':
        msg = 'Please fill out the form !'
    return render_template('register.html', msg = msg)

@app.route('/add_transaction', methods=['POST'])
def add_transaction():
    if 'loggedin' not in session:
        return jsonify({'error': 'Not logged in'}), 401

    try:
        data = request.get_json()
        print(data)# Parse JSON
        if not data:
            return jsonify({'error': 'Invalid JSON payload'}), 400

        # Extract and validate fields
        description = data.get('description')
        amount = data.get('amount')
        category = data.get('category') if data.get('type') == 'Expense' else None
        transaction_type = data.get('type')

        if not all([description, amount, transaction_type]):
            return jsonify({'error': 'Missing required fields'}), 400

        user_id = session['id']
        
        cursor = mysql.connection.cursor()
        cursor.execute(
            'INSERT INTO transactions (user_id, description, amount, category, type) VALUES (%s, %s, %s, %s, %s)',
            (user_id, description, amount, category, transaction_type)
        )
        mysql.connection.commit()
        return jsonify({'message': 'Transaction added successfully'}), 200
    except Exception as e:
        print("Error in add_transaction:", e)
        return jsonify({'error': 'Server error'}), 500



@app.route('/get_transactions')
def get_transactions():
    if 'loggedin' not in session:
        return redirect(url_for('login'))

    user_id = session['id']
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('SELECT * FROM transactions WHERE user_id = %s ORDER BY date DESC', (user_id,))
    transactions = cursor.fetchall()
    return {'transactions': transactions}

@app.route('/delete_transaction/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    if 'loggedin' not in session:
        return redirect(url_for('login'))

    user_id = session['id']
    cursor = mysql.connection.cursor()
    cursor.execute('DELETE FROM transactions WHERE id = %s AND user_id = %s', (transaction_id, user_id))
    mysql.connection.commit()
    return {'message': 'Transaction deleted successfully'}, 200


# print(request.json)
