const rp = require('request-promise'),
      cheerio = require('cheerio');

const options = {
    uri: 'https://xkcd.com/',
    transform: (body) => {
        return cheerio.load(body);
    }
};

rp(options).then(($) => {
    console.log($('#ctitle').text());
    console.log($('#comic').children('img').attr('src').substr(2));
}).catch((err) => {
    console.log(err);
});