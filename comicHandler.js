const requestPromise = require('request-promise'),
      jsdom = require('jsdom').JSDOM,
      mongoose = require('mongoose');

const config = require('./config.json'),
      comics = require('./comics.js');

const Comic = mongoose.model('Comic', mongoose.Schema({
    source: String,
    title: String,
    url: String,
    subtitle: String
}));

/** Get comic from URL 
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
                title: comics(inputSource, page).title,
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
 * Retrieves input comic from databse
 * @export get 
 * @param {Comic} input Input comic
 */
function getComic(input) {
    return new Promise((resolve, reject) => {
        Comic.findOne({title: input.title}, (err, comic) => {
            if (err) {
                reject(`Could not retrieve comic; ${err}`);
            }

            if (comic) {
                resolve(comic);
            } else {
                reject('Could not retrieve comic; no comics found');
            }
        });
    });
}

/**
 * Updates comic in database with version in input, if not already updated
 * @param {Comic} input Input comic
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

module.exports = {
    parse: parseComic,
    get: getComic,
    update: updateComics
};