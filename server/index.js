const nunjucks = require('nunjucks');
const path = require('path');
const express = require('express');
const session = require('express-session');
const mongo = require('mongodb');
const ObjectID = require('mongodb').ObjectID;

let MongoClient = mongo.MongoClient;
let db;

const app = express();

app.use(session({secret: 'some secret here'}))

app.use(express.static(path.normalize(path.join(__dirname, '../views'))));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

nunjucks.configure('./views'), {
    autoescape: true,
    express: app
};

nunjucks.configure(path.normalize(path.join(__dirname, '../views'), { autoescape: true }));


/** Start Web App GET Requests  **/
app.get('/', (req, res) => {
    nunjucks.render('pages/index.njk', { loggedin : req.session.loggedin }, (err, data) => {
        if (err) {
            res.statusCode = 404;
            res.end('Error loading page');
        } else {
            res.statusCode = 200;
            res.contentType = 'text/html';
            res.end(data);
        }
    })
});

app.get('/home', (req, res) => {
    nunjucks.render('pages/index.njk', { loggedin : req.session.loggedin }, (err, data) => {
        if (err) {
            res.statusCode = 404;
            res.end('Error loading page');
        } else {
            res.statusCode = 200;
            res.contentType = 'text/html';
            res.end(data);
        }
    })
});

app.get('/login', (req, res) => {
    if (req.session.loggedin) {
        res.redirect('/profile');
    }
    nunjucks.render('pages/login.njk', { loggedin : req.session.loggedin }, (err, data) => {
        if (err) {
            res.statusCode = 404;
            res.end('Error loading page');
        } else {
            res.statusCode = 200;
            res.contentType = 'text/html';
            res.end(data);
        }
    })
})

app.get('/logout', (req, res) => {
    if (!req.session.loggedin) {
        res.redirect('/login');
    }
    nunjucks.render('pages/logout.njk', { loggedin : req.session.loggedin }, (err, data) => {
        if (err) {
            res.statusCode = 404;
            res.end('Error loading page');
        } else {
            res.statusCode = 200;
            res.contentType = 'text/html';
            res.end(data);
        }
    })
})

app.get('/create', (req, res) => {
    nunjucks.render('pages/create.njk', { loggedin : req.session.loggedin }, (err, data) => {
        if (err) {
            res.statusCode = 404;
            res.end('Error loading page');
        } else {
            res.statusCode = 200;
            res.contentType = 'text/html';
            res.end(data);
        }
    })
})

app.get('/profile', (req, res) => {
    if (!req.session.loggedin || req.session.user == undefined) {
        res.redirect('/login');
    }

    try {
        req.session.user.lastGenres
    } catch (err) {
        res.redirect('/login');
    }
    
    if (req.session.user.lastGenres) {
        let query = { '$and' : [
            
        ]}

        req.session.user.lastGenres.forEach((item) => {
            query['$and'].push({ Genre : item });
        })

        db.collection('movie').find(query).limit(5).toArray((err, result) => {
            if (result.length > 0) {
                req.session.user.recommendedMovies = result;
            }

            console.log(req.session.user.recommendedMovies);

            nunjucks.render('pages/profile.njk', { loggedin : req.session.loggedin, user : req.session.user, }, (err, data) => {
                if (err) {
                    res.statusCode = 404;
                    res.end('Error loading page');
                } else {
                    res.statusCode = 200;
                    res.contentType = 'text/html';
                    res.end(data);
                }
            })
        })
    } else {
        nunjucks.render('pages/profile.njk', { loggedin : req.session.loggedin, user : req.session.user }, (err, data) => {
            if (err) {
                res.statusCode = 404;
                res.end('Error loading page');
            } else {
                res.statusCode = 200;
                res.contentType = 'text/html';
                res.end(data);
            }
        })
    }


    db.collection('movie').find({ '$and' : {}}).limit(5).toArray((err, result) => {
        nunjucks.render('pages/profile.njk', { loggedin : req.session.loggedin, user : req.session.user }, (err, data) => {
            if (err) {
                res.statusCode = 404;
                res.end('Error loading page');
            } else {
                res.statusCode = 200;
                res.contentType = 'text/html';
                res.end(data);
            }
        })
    })
})

app.get('/review', (req, res) => {
    if (!req.session.loggedin || req.session.user == undefined) {
        res.redirect('/login');
    }

    res.redirect('/movie');
})

app.get('/review/:id', (req, res) => {
    if (!req.session.loggedin || req.session.user == undefined) {
        res.redirect('/login');
    }

    if (!req.session.user.isContributing) {
        res.redirect('/profile');
    }

    let objID
    try {
        objID = ObjectID(req.params.id)
    } catch (err) {
        res.statusCode = 404;
        res.send('Movie does not exist');
    }   

    db.collection('movie').find({_id : objID}).toArray((err, result) => {
        if (result.length == 0) {
            res.statusCode = 404;
            res.send('Movie does not exist');
        }

        nunjucks.render('pages/review.njk', { loggedin : req.session.loggedin, user : req.session.user }, (err, data) => {
            if (err) {
                res.statusCode = 404;
                res.end('Error loading page');
            } else {
                res.statusCode = 200;
                res.contentType = 'text/html';
                res.end(data);
            }
        })
    })
})

app.get('/movies', (req, res) => {
    let queries = req.query;
    let flag = false;
    let acceptableQueries = ['title', 'genre', 'year', 'minrating'];

    Object.keys(queries).forEach((item) => {
        if (acceptableQueries.indexOf(item) != -1) {
            flag = true;
        }
    })

    if (flag) {
        let query = { $and : []}

        if (queries.hasOwnProperty('title')) {
            query['$and'].push({Title: { $regex : queries.title, $options : 'gi' }});
        }

        if (queries.hasOwnProperty('genre')) {
            query['$and'].push({Genre: { $regex : queries.genre, $options : 'gi' }});
        }

        if (queries.hasOwnProperty('year')) {
            query['$and'].push({Year : { $regex : queries.year, $options : 'gi' }});
        }

        if (queries.hasOwnProperty('minrating')) {
            query['$and'].push({imdbRating: { $gte : queries.minrating}});
        }

        db.collection('movie').find(query).limit(100).toArray((err, result) => {
            nunjucks.render('pages/movies.njk', { loggedin : req.session.loggedin, movie_list: result }, (err, data) => {
                if (err) {
                    res.statusCode = 404;
                    res.end('Error loading page');
                } else {
                    res.statusCode = 200;
                    res.contentType = 'text/html';
                    res.end(data);
                }
            })
        })
    } else {
        db.collection('movie').find().limit(100).toArray((err, result) => {
            nunjucks.render('pages/movies.njk', { loggedin : req.session.loggedin, movie_list: result }, (err, data) => {
                if (err) {
                    res.statusCode = 404;
                    res.end('Error loading page');
                } else {
                    res.statusCode = 200;
                    res.contentType = 'text/html';
                    res.end(data);
                }
            })
        })  
    }
})

app.get('/movies/:id', (req, res) => {
    let objID
    try {
        objID = ObjectID(req.params.id)
    } catch (err) {
        res.statusCode = 404;
        res.send('Movie does not exist');
    }

    db.collection('movie').find({_id : objID}).toArray((err, result) => {

        if (result.length == 0) {
            res.statusCode = 404;
            res.send('Movie does not exist');
        }

        if (req.session.loggedin) {
            req.session.user.lastGenres = result[0].Genre;
        }

        nunjucks.render('pages/movie.njk', { loggedin : req.session.loggedin, movie: result[0] }, (err, data) => {
            if (err) {
                res.statusCode = 404;
                res.end('Error loading page');
            } else {
                res.statusCode = 200;
                res.contentType = 'text/html';
                res.end(data);
            }
        })
    })
})


app.get('/people', (req, res) => {
    let queries = req.query;

    if (queries.hasOwnProperty('name')) {
        let query = { $and : [
            {name: { $regex : queries.name, $options : 'gi' }}
        ]}

        db.collection('people').find(query).toArray((err, result) => {
            nunjucks.render('pages/people.njk', { loggedin : req.session.loggedin, people_list : result }, (err, data) => {
                if (err) {
                    res.statusCode = 404;
                    res.end('Error loading page');
                } else {
                    res.statusCode = 200;
                    res.contentType = 'text/html';
                    res.end(data);
                }
            })
        })
    } else {
        db.collection('people').find().limit(100).toArray((err, result) => {
            nunjucks.render('pages/people.njk', { loggedin : req.session.loggedin, people_list : result }, (err, data) => {
                if (err) {
                    res.statusCode = 404;
                    res.end('Error loading page');
                } else {
                    res.statusCode = 200;
                    res.contentType = 'text/html';
                    res.end(data);
                }
            })
        })
    }
})

app.get('/people/:id', (req, res) => {
    let isFollowing = true;
    let objID
    
    try {
        objID = ObjectID(req.params.id)
    } catch (err) {
        res.statusCode = 404;
        res.send('Person does not exist');
    }   

    db.collection('people').find({_id : objID}).toArray((err, result) => {
        if (req.session.loggedin) {
            for (let i = 0; i < req.session.user.peopleFollowing.length; i++) {
                if (req.session.user.peopleFollowing[i].id == req.params.id) {
                    isFollowing = false;
                    break;
                }
            }
        }

        if (result.length == 0) {
            res.statusCode = 404;
            res.send('Person does not exist');
        }

        nunjucks.render('pages/person.njk', { loggedin : req.session.loggedin, person : result[0], isFollowing : isFollowing}, (err, data) => {
            if (err) {
                res.statusCode = 404;
                res.end('Error loading page');
            } else {
                res.statusCode = 200;
                res.contentType = 'text/html';
                res.end(data);
            }
        })
    })
})

app.get('/users', (req, res) => {
    
    let queries = req.query;

    if (queries.hasOwnProperty('name')) {
        let query = { $and : [
            {username: { $regex : queries.name, $options : 'gi' }}
        ]}

        db.collection('users').find(query).toArray((err, result) => {
            nunjucks.render('pages/users.njk', { loggedin : req.session.loggedin, user_list : result }, (err, data) => {
                if (err) {
                    res.statusCode = 404;
                    res.end('Error loading page');
                } else {
                    res.statusCode = 200;
                    res.contentType = 'text/html';
                    res.end(data);
                }
            })
        })
    } else {
        db.collection('users').find().toArray((err, result) => {
            nunjucks.render('pages/users.njk', { loggedin : req.session.loggedin, user_list : result }, (err, data) => {
                if (err) {
                    res.statusCode = 404;
                    res.end('Error loading page');
                } else {
                    res.statusCode = 200;
                    res.contentType = 'text/html';
                    res.end(data);
                }
            })
        })
    }
})

app.get('/users/:id', (req, res) => {
    let isFollowing = true;
    let objID
    
    try {
        objID = ObjectID(req.params.id)
    } catch (err) {
        res.statusCode = 404;
        res.send('User does not exist');
    }   

    db.collection('users').find({_id : objID}).toArray((err, result) => {
        if (req.session.loggedin) {
            for (let i = 0; i < req.session.user.usersFollowing.length; i++) {
                if (req.session.user.usersFollowing[i].id == req.params.id) {
                    isFollowing = false;
                    break;
                }
            }
        }

        if (result.length == 0) {
            res.statusCode = 404;
            res.send('User does not exist');
        }

        nunjucks.render('pages/user.njk', { loggedin : req.session.loggedin, data: result[0], isFollowing : isFollowing }, (err, data) => {
            if (err) {
                res.statusCode = 404;
                res.end('Error loading page');
            } else {
                res.statusCode = 200;
                res.contentType = 'text/html';
                res.end(data);
            }
        })
    })
})
/** End Web App GET Requests **/

/** Start Web App POST Requests **/
app.post('/login', (req, res) => {
    // If already logged in, redirect to profile
    // Should never be accessed unless bug or postman-type service
    if (req.session.loggedin) {
        res.redirect('/profile');
    }

    let username = req.body.username;
    let password = req.body.password;

    db.collection('users').find({username: username}).toArray((err, result) => {
        if (err) {
            res.statusCode = 404;
            res.send('Error trying to login, please go back and try again');
        }

        if (result.length > 0) {

            if (result[0].password == password) {
                req.session.loggedin = true;
                req.session.user = result[0];

                res.redirect('/profile');
                return;
            } else {
                res.redirect('/login');
                return;
            }
        } else {
            res.redirect('/login');
            return;
        }
    });
})

app.post('/logout', (req, res) => {
    if (req.session.loggedin) {
        req.session.loggedin = false;
        req.session.user = undefined;
        res.redirect('/login');
    } else {
        res.statusCode = 400;
        res.contentType = 'text/html';
        res.send('Error: You cannot logout if you are not logged in');
    }
})

app.post('/create', (req, res) => {
    if (req.session.loggedin) {
        res.redirect('/profile');
    } else {
        let username = req.body.username;
        let password = req.body.password;

        db.collection('users').find({username : username}).toArray((err, result) => {

            if (result.length > 0) {
                res.send('Username Taken, Please Try Again');
            } else {
                let newUserObj = {
                    username: username,
                    password: password,
                    isContributing: false,
                    followers: [],
                    peopleFollowing: [],
                    usersFollowing: [],
                    reviews: []
                }
                db.collection('users').insertOne(newUserObj, (err, result) => {
                    if (err) {
                        res.statusCode = 400;
                        res.send('Error creating new user');
                    }

                    req.session.loggedin = true;
                    req.session.user = newUserObj;
                    res.redirect('/profile');
                })
            }
        })
    }
})

app.post('/profile', (req, res) => {
    if (!req.session.loggedin || req.session.user == undefined) {
        res.redirect('/login');
    } else {
        req.session.user.isContributing = !req.session.user.isContributing;

        console.log(req.session.user.isContributing);

        db.collection('users').updateOne({_id : ObjectID(req.session.user._id)}, { '$set' : { isContributing : req.session.user.isContributing}}, (err, result) => {
            if (err) {
                res.statusCode = 400;
                res.send('Error Occurred');
            }
            console.log('User: ' + req.session.user.username + ' is now contributing: ' + req.session.user.isContributing);
            res.redirect('/profile');
        })
    }
    return;
})

app.post('/review/:id', (req, res) => {
    let movieID = req.params.id;
    
    db.collection('movie').find({_id : ObjectID(movieID)}).toArray((err, result) => {
        if (err) {
            res.statusCode = 400;
            res.send('Error Occurred');
        }

        if (result.length == 0) {
            res.statusCode = 400;
            res.send('Error Occurred');
        }

        let revObject = {
            username : req.session.user.username,
            user : req.session.user._id,
            movieName : result[0].Title,
            movieID : movieID,
            text : req.body.text
        }

        req.session.user.reviews.push(revObject);
        result[0].Reviews.push(revObject);

        let finalMovieReviews = result[0].Reviews

        
        db.collection('users').updateOne({_id : ObjectID(req.session.user._id)}, { '$set' : { reviews : req.session.user.reviews}}, (err, result) => {
            if (err) {
                res.statusCode = 400;
                res.send('Error Occurred');
            }

            db.collection('movie').updateOne({_id : ObjectID(movieID)}, { '$set' : { Reviews : finalMovieReviews}}, (err, result) => {
                if (err) {
                    res.statusCode = 400;
                    res.send('Error Occurred');
                }

                res.redirect('../movies/' + req.params.id);
            })
        })
    })
})

app.post('/movies', (req, res) => {
    res.redirect('/movies?' + req.body.queryType + '=' + req.body.text);
})

app.post('/people', (req, res) => {
    res.redirect('/people?name=' + req.body.text)
})

app.post('/people/:id', (req, res) => {
    if (!req.session.loggedin || req.session.user == undefined) {
        res.redirect('/login');
    } else {
        
        db.collection('people').find({_id : ObjectID(req.params.id)}).toArray((err, result) => {
            if (err) {
                res.statusCode = 400;
                res.send('Error Occurred');
            }

            let person_index = -1;

            for (let i = 0; i < req.session.user.peopleFollowing.length; i++) {
                if (req.session.user.peopleFollowing[i].id == req.params.id) {
                    person_index = i;
                    break;
                }
            }

            if (person_index != -1) {
                req.session.user.peopleFollowing.splice(person_index, 1);
            } else {
                req.session.user.peopleFollowing.push({ name : result[0].name, id : req.params.id });
            }    

            db.collection('users').updateOne({_id : ObjectID(req.session.user._id)}, { '$set' : { peopleFollowing : req.session.user.peopleFollowing}}, (err, result) => {
                if (err) {
                    res.statusCode = 400;
                    res.send('Error Occurred');
                }
                res.redirect('/people/' + req.params.id);
            })
        })
    }
})

app.post('/users', (req, res) => {
    res.redirect('/users?name=' + req.body.text)
})

app.post('/users/:id', (req, res) => {
    if (!req.session.loggedin || req.session.user == undefined) {
        res.redirect('/login');
    } else if (req.session.user._id == req.params.id) {
        res.redirect('/profile');
    } else {
        
        db.collection('users').find({_id : ObjectID(req.params.id)}).toArray((err, result) => {
            if (err) {
                res.statusCode = 400;
                res.send('Error Occurred');
            }

            let person_index = -1;

            for (let i = 0; i < req.session.user.usersFollowing.length; i++) {
                if (req.session.user.usersFollowing[i].id == req.params.id) {
                    person_index = i;
                    break;
                }
            }

            if (person_index != -1) {
                req.session.user.usersFollowing.splice(person_index, 1);
            } else {
                req.session.user.usersFollowing.push({ username : result[0].username, id : req.params.id });
            }    

            db.collection('users').updateOne({_id : ObjectID(req.session.user._id)}, { '$set' : { usersFollowing : req.session.user.usersFollowing}}, (err, result) => {
                if (err) {
                    res.statusCode = 400;
                    res.send('Error Occurred');
                }
                res.redirect('/users/' + req.params.id);
            })
        })
    }
})
/** End Web App POST Requests **/


/** Start API GET Requests **/
app.get('/api/movies', (req, res) => {
    let queries = req.query;
    let flag = false;
    let acceptableQueries = ['title', 'genre', 'year', 'minrating'];

    Object.keys(queries).forEach((item) => {
        if (acceptableQueries.indexOf(item) != -1) {
            flag = true;
        }
    })

    if (flag) {
        let query = { $and : []}

        if (queries.hasOwnProperty('title')) {
            query['$and'].push({Title: { $regex : queries.title, $options : 'gi' }});
        }

        if (queries.hasOwnProperty('genre')) {
            query['$and'].push({Genre: { $regex : queries.genre, $options : 'gi' }});
        }

        if (queries.hasOwnProperty('year')) {
            query['$and'].push({Year : { $regex : queries.year, $options : 'gi' }});
        }

        if (queries.hasOwnProperty('minrating')) {
            query['$and'].push({imdbRating: { $gte : queries.minrating}});
        }

        db.collection('movie').find(query).limit(100).toArray((err, result) => {
            if (err) throw err;
    
            res.contentType = 'application/json';
            res.statusCode = 200;
            res.send(result);
        })
    } else {
        db.collection('movie').find().limit(100).toArray((err, result) => {
            if (err) throw err;
    
            res.contentType = 'application/json';
            res.statusCode = 200;
            res.send(result);
        })
    }
    
});

app.get('/api/movies/:id', (req, res) => {
    let movieId = req.params.id;
    db.collection('movie').find({_id : ObjectID(movieId)}).toArray((err, result) => {
        if (err) throw err;

        res.send(result);
    })
})

app.get('/api/people', (req, res) => {
    let queries = req.query;

    if (queries.hasOwnProperty('name')) {
        let query = { $and : [
            {name: { $regex : queries.name, $options : 'gi' }}
        ]}

        db.collection('people').find(query).toArray((err, result) => {
            if (err) throw err;

            res.contentType = 'json';
            res.statusCode = 200;
            res.send(result);
        })
    } else {
        db.collection('people').find().toArray((err, result) => {
            if (err) throw err;

            res.contentType = 'json';
            res.statusCode = 200;
            res.send(result);
        })
    }
});

app.get('/api/people/:id', (req, res) => {
    let personId = req.params.id;
    db.collection('people').find({_id : ObjectID(personId)}).toArray((err, result) => {
        if (err) throw err;

        res.send(result);
    })
})

app.get('/api/users', (req, res) => {
    let queries = req.query;

    if (queries.hasOwnProperty('name')) {
        let query = { $and : [
            {username: { $regex : queries.name, $options : 'gi' }}
        ]}

        db.collection('users').find(query).toArray((err, result) => {
            if (err) throw err;

            res.contentType = 'json';
            res.statusCode = 200;
            res.send(result);
        })
    } else {
        db.collection('users').find().toArray((err, result) => {
            if (err) throw err;

            res.contentType = 'json';
            res.statusCode = 200;
            res.send(result);
        })
    }
});

app.get('/api/users/:id', (req, res) => {
    let userId = req.params.id;
    db.collection('users').find({_id : ObjectID(userId)}).toArray((err, result) => {
        if (err) throw err;

        res.send(result);
    })
})

/** End API GET Requests **/


/** Mongo Connection and Server Startup */
MongoClient.connect("mongodb://localhost:27017/", function(err, client) {
  if (err) throw err;

  //Get the t8 database
  db = client.db('basic');
  
  // Start server once Mongo is initialized
  app.listen(3000);
  console.log('Listening on port 3000: http://localhost:3000');
});
