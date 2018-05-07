const requestPromise = require('request-promise'),
      cheerio = require('cheerio'),
      mongoose = require('mongoose');

const config = require('./config.json');

const options = {
    uri: 'https://xkcd.com/',
    transform: (body) => {
        return cheerio.load(body);
    }
};

const comicSchema = mongoose.Schema({
    title: String,
    url: String,
    subtitle: String
});

mongoose.connect(config.mongoAuth).then(
    () => {
        console.log('Connected to MongoDB');
    },
    err => {
        console.log(err);
    }
);

const Comic = mongoose.model('Comic', comicSchema);

module.exports = function() {
    return new Promise((resolve, reject) => {
        requestPromise(options).then(($) => {
            const current = {
                title: $('#ctitle').text(),
                url: `https:${$('#comic').children('img').attr('src')}`,
                subtitle: $('#comic').children('img').attr('title')
            };
        
            Comic.findOne({}, function(err, comic) {
                let state;
        
                if (err) {
                    reject(`Encounted error: ${err}`);
                }
        
                if (comic) {
                    if (comic.title !== current.title) {
                        comic.title = current.title;
                        comic.url = current.url;
                        comic.subtitle = current.subtitle;
        
                        state = 'updated';
                    } else {
                        state = 'not updated';

                        reject('Comic up to date');
                    }
                    
                } else {
                    const comic = new Comic(current);
        
                    state = 'initiated';
                }
        
                comic.save().then(
                    () => {
                        console.log(`Comic ${state}`);
        
                        mongoose.disconnect();
        
                        resolve(comic);
                    },
                    err => {
                        reject(`Encounted error: ${err}`);
        
                        mongoose.disconnect();
                    }
                );
            });
        }).catch((err) => {
            reject(`Encounted error: ${err}`);
        });
    });
};