/**
 * Webcomic scraper
 * @module comicscraper
 */
module.exports = {
    initialize: initialize,
    init: initialize,
    parse: parseComic,
    read: parseComic,
    get: getComic,
    fetch: getComic,
    update: updateComics
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

const config = {};

/**
 * Configuration for ComicHandler
 * @param {object} input input configuration
 */
function initialize(input) {
    config.mongoAuth = input.mongoAuth;
}

/** 
 * Get comic from URL
 * @exports parse
 * @param input Input URL
 * @returns Promise that resolves to comic object
 */
function parseComic(input) {
    return new Promise((resolve, reject) => {
        requestPromise({uri: input}).then(page => {
            page = new jsdom(page).window.document;

            let inputSource = input.match(/^(http[s]?:\/\/)?(www\.)?([\w-]*)/)[3];
    
            /* Initiates new comic object from page parameters */
            const comic = new Comic({
                source: inputSource,
                title: page.querySelector('title').textContent,
                url: comics(inputSource, page).url,
                subtitle: comics(inputSource, page).subtitle
            });
    
            resolve(comic);
        }).catch(err => {
            reject(`Could not retrieve comic; ${err}`);
        });
    });
}

/**
 * Retrieves comic matching input URL from database
 * @export get 
 * @param {Comic} input URL for input comic
 * @returns Promise that resolves to comic in database
 */
function getComic(input) {
    return new Promise((resolve, reject) => {
        Comic.findOne({source: input.match(/^(http[s]?:\/\/)?(www\.)?([\w-]*)/)[3]}, (err, comic) => {
            if (err) {
                reject(`Could not retrieve comic; ${err}`);
            }

            if (comic) {
                resolve(comic);
            } else {
                reject('Could not retrieve comic; not found in database');
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
function updateComics(input) {
    return new Promise((resolve, reject) => {
        if (!(input && input._id)) {
            reject('Illegal input: input must contain comic object');
        }

        checkComic(input).then(upToDate => {
            if (upToDate) {
                reject('No updates; comic up to date');
            } else {
                comic = input;

                comic.save().then(() => {
                    mongoose.disconnect();
    
                    resolve('Comic updated');
                }).catch(err => {
                    mongoose.disconnect();
    
                    reject(`No updates; ${err}`);
                });
            }
        });
    });
}

/* UTILITY */

/*
 * Checks database for current version of comic
 * Returns a promise that resolves to true if the comic is up to date and false otherwise
 */
function checkComic(input) {
    return new Promise((resolve, reject) => {
        if (!(input && input._id)) {
            reject('Illegal input: input must contain comic object');
        }

        mongoose.connect(config.mongoAuth).then(
            () => {
                console.log('Connected to MongoDB');
            },
            err => {
                reject(`Could not connect to database; ${err}`);
            }
        );

        Comic.findOne({source: input.source}, (err, comic) => {
            if (err) {
                mongoose.disconnect();

                reject(`Couldn't check for updates; ${err}`);
            }

            if (comic && comic.title === input.title) {
                mongoose.disconnect();

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