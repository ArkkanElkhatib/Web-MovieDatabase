const fs = require('fs');
const mongo = require('mongodb');
let MongoClient = mongo.MongoClient;
let db;
let movie_list = [];

MongoClient.connect("mongodb://localhost:27017/", function(err, client) {
    if(err) throw err;	

    db = client.db('basic');
    fs.readFile('movie-data.json', (err, data) => {
        if (err) throw err;

        movie_list = JSON.parse(data);

        movie_list.forEach((item) => {
            delete item.Language;
            delete item.Country;
            delete item.imdbVotes;
            delete item.imdbID;
            delete item.Type;
            delete item.DVD;
            delete item.Production;
            delete item.Website;
            delete item.Response;
            delete item.Ratings;
            delete item.Metascore;
            delete item.Awards;
            delete item.BoxOffice;
        })

        movie_list.forEach((test) => {
            test.Actors = test.Actors.split(', ');

            test.Reviews = [];

            test.Genre = test.Genre.split(', ');

            test.Writer = test.Writer.split(', ');
            test.Writer = test.Writer.map((item) => {
                let indexOpen = item.indexOf('(');
                if (indexOpen == -1) {
                    return item;
                } else {
                    return item.substring(0, indexOpen - 1);
                }  
            })

            // Removing Duplicates
            test.Actors = [...new Set(test.Actors)];
            test.Writer = [...new Set(test.Writer)];
        });

        //Compiling All Names
        let people = [];
        movie_list.forEach((item) => {
            people.push(item.Director);
            people.push(...item.Writer);
            people.push(...item.Actors);
        })

        people = [... new Set(people)];

        let table = people.map((person) => {
        return { name: person, roles : [], movies : [] };
        })

        movie_list.forEach((movie) => {
            let tempPerson = table.find((element) => {
                return element.name == movie.Director;
            })
            tempPerson ? tempPerson.roles.push('Director') : false;
            tempPerson ? tempPerson.movies.push(movie.Title) : false;
            movie.Writer.forEach((item) => {
                let curPerson = table.find((element) => {
                    return element.name == item;
                })
                curPerson ? curPerson.roles.push('Writer') : false;
                curPerson ? curPerson.movies.push(movie.Title) : false;
            })
            movie.Actors.forEach((item) => {
                let curPerson = table.find((element) => {
                    return element.name == item;
                })
                curPerson ? curPerson.roles.push('Actor') : false;
                curPerson ? curPerson.movies.push(movie.Title) : false;
            })
        })

        table.forEach((item) => {
            item.roles = [...new Set(item.roles)];
            item.movies = [...new Set(item.movies)];
        })

        db.collection('movie').insertOne({a:1}, (err, result) => {
            if (err) throw err;
            
            db.collection('movie').drop((err, delOK) => {
                if (err) throw err;
                
                db.collection('movie').insertMany(movie_list, (err, result) => {
                    if (err) throw err;

                    console.log('Inserted ', result.insertedCount, " items.");
                })
            })
        });

        db.collection('people').insertOne({a:1}, (err, result) => {
            if (err) throw err;

            db.collection('people').drop((err, delOK) => {
                if (err) throw err;

                db.collection('people').insertMany(table, (err, result) => {
                    if (err) throw err;

                    console.log('Inserted ', result.insertedCount, ' items.');
                    process.exit();
                })
            });
        })
    });
});
