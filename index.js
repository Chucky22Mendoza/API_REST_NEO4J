const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const neo4j = require('neo4j-driver');

const app = express();

//CONFIG NEO4J
const uri = 'bolt://localhost';
const user = 'neo4j';
const password = '1234';

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const session = driver.session();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//  url_root = http://localhost:4000/

app.get('/videogames', function(req, res, next){
    session
        .run('MATCH(n:Videogame) RETURN n LIMIT 25')
        .then(function(result){
            var videogameArr = [];
            result.records.forEach(function(record){
                videogameArr.push({
                    id: record._fields[0].identity.low,
                    title: record._fields[0].properties.title,
                    director: record._fields[0].properties.director
                });
            });

            res.json(videogameArr);
        })
        .catch(function(error){
            res.json({msg: 'Nodes not found'});
        });
});

app.get('/developers', function(req, res, next){
    session
        .run('MATCH(n:Developer) RETURN n LIMIT 25')
        .then(function(result){
            var developerArr = [];
            result.records.forEach(function(record){
                developerArr.push({
                    id: record._fields[0].identity.low,
                    name: record._fields[0].properties.name,
                });
            });

            res.json(developerArr);
        })
        .catch(function(error){
            res.json({msg: 'Nodes not found'});
        });
});

app.get('/search_node/:id', function(req, res, next){
    var id = req.params.id;
    session
        .run('MATCH (n) WHERE ID(n) = ' + id + ' RETURN n')
        .then(function(result){
            var vgArr = [];
            result.records.forEach(function(record){
                vgArr.push({
                    id: record._fields[0].identity.low,
                    title: record._fields[0].properties.title,
                    director: record._fields[0].properties.director
                });
            });

            if(vgArr.length > 0){
                res.json({msg: 'Node found Succesfully', data: vgArr});
            }else{
                res.json({msg: 'Node not found'});
            }
        })
        .catch(function(error){
            res.json({msg: 'Record not found'});
        });
});

app.post('/videogames/add', function(req, res){
    var title = req.body.title;
    var director = req.body.director;

    session
        .run('CREATE(n:Videogame {title:{titleParam}, director: {directorParam}}) RETURN n.title',{
            titleParam: title,
            directorParam: director
        })
        .then(function(result){
            res.json({msg: 'Added Successfully'})
            session.close();
        })
        .catch(function(error){
            res.json({msg: 'Node not created'});
        });
});

app.post('/developers/add', function(req, res){
    var name = req.body.name;

    session
        .run('CREATE(n:Developer {name:{nameParam}}) RETURN n.name',{
            nameParam: name,
        })
        .then(function(result){
            res.json({msg: 'Added Successfully'})
            session.close();
        })
        .catch(function(error){
            res.json({msg: 'Node not created'});
        });
});

app.post('/videogame/developer/add', function(req, res){
    var title = req.body.title;
    var name = req.body.name;
    var year = req.body.year;

    session
        .run('MATCH(a:Developer {name:{nameParam}}), (b:Videogame {title:{titleParam}}) MERGE (a)-[r:RELEASE {since:{yearParam}}]->(b) RETURN a,b',{
            titleParam: title,
            nameParam: name,
            yearParam: year,
        })
        .then(function(result){
            res.json({msg: 'Node added Successfully'});
            session.close();
        })
        .catch(function(error){
            res.json({msg: 'Node not created'});
        });
});

app.get('/delete_node/:id', function(req, res, next){
    var id = req.params.id;
    session
        .run('MATCH (n) WHERE ID(n) = ' + id + ' OPTIONAL MATCH (n)-[r]-() DELETE n,r')
        .then(function(result){
            mssg = 'Node with id = ' + id + ' deleted Succesfully'
            res.json({msg: mssg});
        })
        .catch(function(error){
            res.json({msg: 'Node not found'});
        });
});

app.get('/videogames/multi_add', function(req, res){
    var title = 'node_title_YY_X_';
    var director = 'node_title_YY_X_';

    for (let i = 0; i < 5805; i++) {
        title = title + i;
        director = director + i;

        const session = driver.session();

        session
        .run('CREATE(n:Videogame {title:{titleParam}, director: {directorParam}}) RETURN n.title',{
            titleParam: title,
            directorParam: director
        })
        .then(function(result){
            console.log(i);
        })
        .catch(function(error){
            console.log(error);
        });
    }

    res.json({msg: 'Ended Successfully'})
});

app.listen(4000);
console.log('Server started on port 4000');

module.exports = app;