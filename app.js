const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');

const app = express();
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

const port = 3000;

app.get('/',(req, res) => {
    res.render('work');
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/contact', (req, res) => {
    res.render('contact');
})

app.get('/:folder', (req, res) => {
    res.render('show');
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})
