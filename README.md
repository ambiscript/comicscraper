# comicscraper

Webcomic scraper

## Installation

`git clone https://github.com/ambiscript/xkcd-comicscraper`

## Usage

NOTE: All return values are promises.

To include in your Node project,
`const comicHandler = require('./comicscraper/comicHandler'`

### parse(comicURL)

Parse a supported webcomic link (see note on current suport) and return a comic object (mongoose Schema)

### get(comicObject)

Search linked database for input comic object and return it if present

### update(comicObject)

Update linked database if input comic Object is different than the most recent stored in database

## Currently supports

[xkcd](https://xkcd.com/)
[Girl Genius](http://www.girlgeniusonline.com/)

### Note

This project is unaffiliated with any of the supported comics, and will remove support of any comic at  its owners' request.

Modified from [this tutorial](https://codeburst.io/an-introduction-to-web-scraping-with-node-js-1045b55c63f7)
