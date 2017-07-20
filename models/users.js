'use strict';

// Imports
const db = require('./db');

exports.getUser = function(socket, data, done) {
    let sql = `
        SELECT
            id,
            username,
            password,
            num_played,
            average_score,
            strikeout_rate
        FROM users
        WHERE username = ?
    `;
    let values = [data.username];
    db.query(sql, values, function (error, results, fields) {
        if (error) {
            done(error, socket, data, null);
            return;
        }

        if (results.length === 0) {
            data.userID = null;
        } else if (results.length !== 1) {
            let error = new Error(`Got ${results.length} rows in the "users" table for: ${data.username}`);
            done(error, socket, data, null);
            return;
        } else {
            data.userID         = results[0].id;
            data.username       = results[0].username;
            // We replace the existing username in case that they submitted the
            // wrong case
            data.realPassword   = results[0].password;
            data.num_played     = results[0].num_played;
            data.average_score  = results[0].average_score;
            data.strikeout_rate = results[0].strikeout_rate;
        }

        done(null, socket, data);
    });
};

exports.create = function(socket, data, done) {
    let sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    let values = [data.username, data.password];
    db.query(sql, values, function (error, results, fields) {
        if (error) {
            done(error, socket, data);
            return;
        }

        data.userID         = results.insertId;
        data.num_played     = 0;
        data.average_score  = 0;
        data.strikeout_rate = 0;
        done(null, socket, data);
    });
};

exports.updateStats = function(data, done) {
    let sql = `
        UPDATE users
        SET
            num_played = (
                SELECT COUNT(id) FROM game_participants WHERE user_id = ?
            ),
            average_score = (
                SELECT AVG(games.score)
                FROM games
                    JOIN game_participants
                        ON game_participants.game_id = games.id
                WHERE game_participants.user_id = ? AND games.score != 0
            ),
            strikeout_rate = (
                SELECT COUNT(games.id)
                FROM games
                    JOIN game_participants
                        ON game_participants.game_id = games.id
                WHERE game_participants.user_id = ? AND games.score = 0
            ) / (
                SELECT COUNT(id) FROM game_participants WHERE user_id = ?
            )
        WHERE id = ?
    `;
    let values = [
        data.userID,
        data.userID,
        data.userID,
        data.userID,
        data.userID,
    ];
    db.query(sql, values, function (error, results, fields) {
        if (error) {
            done(error, data);
            return;
        }

        done(null, data);
    });
};


exports.getStats = function(data, done) {
    let sql = `
        SELECT num_played, average_score, strikeout_rate
        FROM users
        WHERE id = ?
    `;
    let values = [data.userID];
    db.query(sql, values, function (error, results, fields) {
        if (error) {
            done(error, data, null);
            return;
        }

        if (results.length === 0) {
            let error = new Error(`There was no rows in the "users" table for the user ID of: ${data.userID}`);
            done(error, data, null);
            return;
        } else if (results.length !== 1) {
            let error = new Error(`Got ${results.length} rows in the "users" table for the user ID of: ${data.userID}`);
            done(error, data, null);
            return;
        }

        data.num_played     = results[0].num_played;
        data.average_score  = results[0].average_score;
        data.strikeout_rate = results[0].strikeout_rate;

        done(null, data);
    });
};
