/*
 * Returns comic data depending on source URL
 */
function getData(source, page) {
    // https://xkcd.com/
    if (source === 'xkcd') {
        return {
            title: page.getElementById('ctitle').textContent,
            url: `https:${page.getElementById('comic').children[0].getAttribute('src')}`,
            subtitle: page.getElementById('comic').children[0].getAttribute('title')
        };
    }

    // http://www.girlgeniusonline.com/comic
    if (source === 'girlgeniusonline') {
        return {
            title: page.getElementById('datestring').textContent,
            url: `https:${page.getElementById('comicbody').children[1].getAttribute('src')}`,
            subtitle: page.getElementById('comicbody').children[2].children[0].children[2].
                      children[0].children[0].textContent
        };
    }
}

module.exports = getData;