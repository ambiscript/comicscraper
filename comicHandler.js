/**
 * Webcomic scraper
 * @module comicscraper
 */
module.exports = {
    parse: parse,
    connect: connect,
    disconnect: disconnect,
    get: get,
    update: update
};

const requestPromise = require('request-promise'),
      jsdom = require('jsdom').JSDOM,
      mongoose = require('mongoose');

const comics = require('./comics.js');

const Comic = mongoose.model('Comic', mongoose.Schema({
    source: String,
    title: String,
    url: String,
    subtitle: String
}));

class UpdateError extends Error {
    constructor(...params) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, UpdateError);
        }
    }
}

class RetrievalError extends Error {
    constructor(...params) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, RetrievalError);
        }
    }
}

/**
 * Connects to MongoDB database
 * @exports connect
 * @param {String} auth MongoDB auth token
 * @param {Object} options (Optional) mongoose options object
 * @returns true if connected
 */
function connect(auth, options) {
    return new Promise((resolve, reject) => {
        mongoose.connect(auth, options).then(() => {
            console.log('Connected to MongoDB');
            resolve(true);
        }).catch(err => {
            reject(err);
        });
    });
}

/** 
 * Get comic from URL
 * @exports parse
 * @param input Input URL
 * @returns Promise that resolves to comic object
 */
function parse(input) {
    return new Promise((resolve, reject) => {
        requestPromise({uri: input}).then(page => {
            page = new jsdom(page).window.document;

            let inputSource = input.match(/^(http[s]?:\/\/)?(www\.)?([\w-]*)/)[3];
    
            /* Initializes new comic object from page parameters */
            const comic = new Comic({
                source: inputSource,
                title: page.querySelector('title').textContent,
                url: comics(inputSource, page).url,
                subtitle: comics(inputSource, page).subtitle
            });
    
            resolve(comic);
        });
    });
}

/**
 * Retrieves comic matching input URL from database
 * @export get 
 * @param {Comic} input URL for input comic
 * @returns Promise that resolves to comic in database
 */
function get(input) {
    return new Promise((resolve, reject) => {
        Comic.findOne({source: input.match(/^(http[s]?:\/\/)?(www\.)?([\w-]*)/)[3]}, (err, comic) => {
            if (comic) {
                resolve(comic);
            } else {
                reject(new RetrievalError('Comic not found in database'));
            }
        });
    });
}

/**
 * Updates comic in database with version in input, if not already updated
 * @exports update
 * @param {Comic} input Input comic
 * @returns Promise representing status of update
 */
function update(input) {
    return new Promise((resolve, reject) => {
        if (!(input && input.constructor.name.toLowerCase() === 'model')) {
            reject(new TypeError("Input must be comic object"));
        }

        checkComic(input).then(upToDate => {
            if (upToDate) {
                reject(new UpdateError('Comic up to date'));
            } else {
                comic = input;

                comic.save().then(() => {
                    resolve('Comic updated');
                });
            }
        });
    });
}

/**
 * Disconnects from MongoDB database
 * @exports disconnect
 */
function disconnect() {
    console.log('Mongoose disconnected');
    mongoose.disconnect();
}

/* UTILITY */

/**
 * Checks database for current version of comic
 * @param {Comic} input Input comic
 * @returns Promise that resolves to true if the comic is up to date and false otherwise
 */
function check(input) {
    return new Promise((resolve, reject) => {
        if (!(input && input.constructor.name.toLowerCase() === 'model')) {
            reject(new TypeError("Input must be comic object"));
        }

        Comic.findOne({source: input.source}, (err, comic) => {
            if (comic && comic.title === input.title) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

/*
 * If the Node process ends, close the Mongoose connection
 * from https://stackoverflow.com/a/19374969/1211175/
 */
process.on('SIGINT', () => {
    mongoose.connection.close(() => {
        console.log('Mongoose disconnected on app termination');
        process.exit(0);
    });
});