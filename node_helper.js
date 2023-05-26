const yahooFinance = require('yahoo-finance2').default;

var NodeHelper = require("node_helper");

String.prototype.hashCode = function() {
    var hash = 0
    if (this.length == 0) {
        return hash;
    }
    for (var i = 0; i < this.length; i++) {
        var char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash;
    }
    return hash;
}

module.exports = NodeHelper.create({
    start: function() {
        this.config = null;
    },

    socketNotificationReceived: function(notifyID, payload) {
        if (notifyID == "INIT") {
            this.config = payload;
            console.log("[MKTINDEX] Initialized.");
        } else if (notifyID == "UPDATE") {
            // Query immediately
            this.callAPI(this.config, (notifyID, payload) => {
                this.sendSocketNotification(notifyID, payload);
            })
        }
    },

    getQuotes: async function(symbolList) {
        var fields = [
            'symbol',
            'regularMarketTime',
            'regularMarketPrice',
            'regularMarketPreviousClose',
            'regularMarketChange',
            'regularMarketChangePercent'
        ];
        this.log("Querying: " + symbolList);
        const quotes = await yahooFinance.quote(symbolList, {fields: fields}, {validateResult: false});
        return quotes;
    },

    callAPI: function(cfg, callback) {
        this.log("Query API for current market summary");
        this.getQuotes(cfg.symbols).then(quotes => {
            this.log("Quotes returned = " + quotes.length);
            if (quotes.length == 0) {
                console.log("[MKTINDEX] Data Error: There is no available data");
            } else {
                this.log("Sending result: " + quotes.length + " items");
                callback('UPDATE', quotes);
            }
        })
        .catch(err => {
            console.error("[MKTINDEX] API Error: ", err.message);
            return;
        });
    },

    log: function (msg) {
        if (this.config && this.config.debug) {
            console.log(this.name + ": ", (msg));
        }
    },
})
