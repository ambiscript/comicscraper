const requestPromise = require('request-promise'),
      jsdom = require('jsdom').JSDOM,
      mongoose = require('mongoose');

const config = require('./config.json');

const options = {
    uri: 'https://xkcd.com/'
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
        requestPromise(options).then((page) => {
            page = new jsdom(page);

            const current = {
                title: page.window.document.getElementById('ctitle').textContent,
                url: `https:${page.window.document.getElementById('comic').children[0].getAttribute('src')}`,
                subtitle: page.window.document.getElementById('comic').children[0].getAttribute('title')
            };
        
            Comic.findOne({}, function(err, comic) {
                let state;
        
                if (err) {
                    reject(`ERROR: ${err}`);
                }

                if (comic && comic.title === current.title) {
                    state = 'not updated';

                    reject('ERROR: No updates');
                } else {
                    if (comic) {
                        comic.title = current.title;
                        comic.url = current.url;
                        comic.subtitle = current.subtitle;
        
                        state = 'updated';
                    } else {
                        const comic = new Comic(current);
        
                        state = 'initiated';
                    }

                    comic.save().then(
                        () => {
                            mongoose.disconnect();
            
                            resolve(comic);
                        },
                        err => {
                            reject(`ERROR: ${err}`);
            
                            mongoose.disconnect();
                        }
                    );

                    console.log(`Comic ${state}`); 
                }
            });
        }).catch((err) => {
            reject(`ERROR: ${err}`);
        });
    });
};