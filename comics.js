/*
 * Returns comic data depending on source URL
 */
function getData(source, page) {
    // https://xkcd.com/
    if (source === 'xkcd') {
        return {
            url: `https:${page.getElementById('comic').querySelector('img').getAttribute('src')}`,
            subtitle: page.getElementById('comic').querySelector('img').getAttribute('title')
        };
    }

    // http://www.girlgeniusonline.com/comic
    if (source === 'girlgeniusonline') {
        return {
            url: `${page.getElementById('comicbody').querySelector('img').getAttribute('src')}`,
            subtitle: page.querySelector('title').textContent
        };
    }

    // https://www.smbc-comics.com/comic/
    if (source === 'smbc-comics') {
        return {
            url: page.getElementById('cc-comic').getAttribute('src'),
            subtitle: page.getElementById('cc-comic').getAttribute('title')
        };
    }

    // http://abstrusegoose.com/
    if (source === 'abstrusegoose') {
        return {
            url: page.querySelector('section').querySelector('img').getAttribute('src'),
            subtitle: page.querySelector('section').querySelector('img').getAttribute('title')
        };
    }
}

module.exports = getData;