var express = require('express'), 
    path = require('path'),
    urls = require('./urls');

var app = module.exports = express.createServer().configure(function() {
    // Root folder for views
    this.set('views', path.join(__dirname, "views"));
    
    // Default filename extension and corresponding view engine
    this.set('view engine', 'ejs.html');
    this.register('ejs.html', require('ejs'));
    
    // Middleware
    this.use(express.bodyParser());
});

app.listen(process.env.PORT || 8080);

app.get('/', function (req, res) {
    urls.count(function(numUrls) {
        res.render('index', { 
            numUrls: numUrls
        });            
    });
});

app.post('/submitUrl', function(req, res) {
    urls.shorten(req.body.urlToShorten, function(shortened) {
        res.render('success', {
            originalUrl: req.body.urlToShorten,
            shortenedUrl: 'http://' + req.headers.host + '/' + shortened.id
        });
    });
});

app.get('/:shortenedUrl', function(req, res, next) {
    urls.findById(req.params.shortenedUrl, function(data) {
        if (data) {
            res.redirect(data.url)
        } else {
            next(); // Let Connect or some other middleware handle the request
        }
    });
});