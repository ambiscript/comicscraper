/**
 * Webcomic scraper
 * @module comicscraper
 */
module.exports = {
    parse: parseComic,
    connect: connectToDatabase,
    disconnect: disconnectFromDatabase,
    get: getComic,
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
 * Connects to MongoDB database
 * @param {String} auth MongoDB auth token
 */
function connectToDatabase(auth) {
    mongoose.connect(config.mongoAuth).then(
        () => {
            console.log('Connected to MongoDB');
        },
        err => {
            console.log(`Connection failed; ${err}`);
        }
    );
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
    
            /* Initializes new comic object from page parameters */
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
                    resolve('Comic updated');
                }).catch(err => {
                    reject(`No updates; ${err}`);
                });
            }
        });
    });
}

/**
 * Disconnects from MongoDB database
 */
function disconnectFromDatabase() {
    mongoose.disconnect();
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

        Comic.findOne({source: input.source}, (err, comic) => {
            if (err) {
                reject(`Couldn't check for updates; ${err}`);
            }

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