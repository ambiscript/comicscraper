# comicscraper

Webcomic scraper

## Installation

`npm install comicscraper --save`

## Usage

NOTE: All return values are promises.

To include in your Node project

```js
const comicHandler = require('./comicscraper/comicHandler';
```

### initialize(comicURL)

Before using comicscraper, it would be wise to create a config file and import it using the initalize function

```json
{
    "mongoAuth": "<MongoDB authorization token>"
}
```

```js
const config = require('./config.json');

comicHandler.initialize({
    mongoAuth: config.mongoAuth;
});
```

### parse(comicURL)

Parse a supported webcomic link (see note on current suport) and return a comic object (mongoose Schema)

```js
comicHandler.parse('https://xkcd.com/').then(comic => {
    // Comic processing here
}).catch(err => {
    // Error handling here
});
```

### get(comicObject)

Search linked database for input comic object and return it if present

```js
comicHandler.get(comicObject).then(comic => {
    // Comic processing here
}).catch(err => {
    // Error handling here
});
```

### update(comicObject)

Update linked database if input comic Object is different than the most recent stored in database

```js
comicHandler.update(comicObj).then(status => {
    console.log(status);
}).catch(err => {
    // Error handling here
});
```

## Currently supports

[xkcd](https://xkcd.com/)\
[Girl Genius](http://www.girlgeniusonline.com/)

### Note

This project is unaffiliated with any of the supported comics, and will remove support of any comic at  its owners' request.

Modified from [this tutorial](https://codeburst.io/an-introduction-to-web-scraping-with-node-js-1045b55c63f7)
