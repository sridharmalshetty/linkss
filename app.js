var express = require('express');
var shortid = require('shortid');
var http = require('http');
var multiparty = require('connect-multiparty');
var multipartyMiddleware = multiparty();
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;

var app = express();
app.use(multipartyMiddleware);
app.set('port', process.env.PORT || 3000);

//create connection to database
var config = {
  userName: 'arjun',
  password: 'KLFNEpxoZkOJ0YZiGxcL',
  server: 'linkss.database.windows.net',
  options: {
    database: 'linkss',
    encrypt: true
  }
};
var connection = new Connection(config);
//attempt to connect and execute queries if connection successful
connection.on('connect', function(err) {
  if (err) {
    console.log(err);
  }
  else {
    console.log("It works i guess!")
  }
})

app.get('/', function(req, res) {
  res.sendFile('static/index.html', {root: __dirname});
});

app.get('/static/:file', function(req, res) {
  res.sendFile(path.join(_dirname, '/static/', req.params['file']));
});

app.get('/:short_id', function(req, res) {
  let short_id = req.params['short_id'];
  request = new Request(
    `SELECT full_url FROM links WHERE short_id='${short_id}'`,
    function(err, rowCount, rows) {
      console.log(rowCount + ' row(s) returned');
    }
  );
  request.on('row', function(columns) {
    columns.forEach(function(column) {
      console.log("%s  %s", column.metadata.colName, column.value);
      res.redirect(column.value);
    });
  });
  connection.execSql(request);
  setTimeout(function() {
    incrementOpens(short_id);
  }, 500);
});

app.post('/', function(req, res) {
  let short_id = shortid.generate();
  let full_url = req.body.full_url;

  request = new Request(
    `INSERT INTO links VALUES('${short_id}', '${full_url}', 1)`,
    function(err, rowCount, rows) {
      if(!err) {
        res.send(short_id);
        console.log(rowCount + ' row(s) returned');
      }
      else {
        console.log(err);
      }
    }
  );
  connection.execSql(request);
});

function incrementOpens(short_id) {
  request = new Request(
    `UPDATE links SET opens += 1 WHERE short_id='${short_id}'`,
    function(err, rowCount, rows) {
      if(err) {
        console.log(err)
      }
      else {
        console.log(rowCount + ' row(s) returned');
      }
    }
  );
  connection.execSql(request);
}


app.listen(app.get('port'));
console.log(`magic happens on port ${app.get('port')}`);