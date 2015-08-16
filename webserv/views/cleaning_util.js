var url_for = require('../url_for');

module.exports.reducer = function (cleaner, total, item) {
    try {
        total.push(cleaner(item));
        if (item.last_update && item.last_update.getTime() > this.dt.getTime()) {
            this.dt = item.last_update;
        }
    }
    catch (e) {
        // loggging?
    }
    return total;
};

module.exports.cleanItem = function  (item_data) {
    var obj = {};
    obj.apiurl = url_for.item(item_data._id.toString());
    obj.meta_apiurl =  url_for.feed(item_data.meta_id.toString());
    obj.link =  item_data.link;
    obj.title = item_data.title;
    obj.pubdate = item_data.pubdate;
    obj.read = item_data.read || false;
    if (item_data.content_id) {
        obj.content_apiurl = url_for.content(item_data.content_id);
    }
    if (item_data.starred!==undefined) { obj.starred = item_data.starred; }
    return obj;
};

module.exports.cleanMeta = function  (meta) {
    var obj = {};
    obj.apiurl = url_for.feed(meta._id.toString());
    obj.feedurl =  meta.feedurl;
    if (meta.link) obj.link =  meta.link;
    obj.title = meta.title;
    if (meta.userTitle) obj.userTitle = meta.userTitle;
    if (meta.labels) obj.labels = meta.labels;
    if (meta.description) { obj.description = meta.description; }
    return obj;
};
