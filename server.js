const express = require('express');
const { animals } = require('./data/animals');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;

const app = express();
// parse incoming string or array data
app.use(express.urlencoded({ extended: true }));
// parse incoming JSON data
app.use(express.json());
// express.static() method. The way it works is that we provide a file path to a location in our application
// (in this case, the public folder) and instruct the server to make these files static resources.
// This means that all of our front-end code can now be accessed without having a specific server endpoint created for it!
// Every time we create a server that will serve a front end as well as JSON data, we'll always want to use this middleware.
app.use(express.static('public'));

function filterByQuery(query, animalsArray) {
   // animalsArray is the JSON that has the whole 'database'
   let personalityTraitsArray = [];
   // Note that we save the animalsArray as filteredResults here:
   let filteredResults = animalsArray;
   // this personalityTraitsArray processes queries (parameter in line 14) where the route has 'AND' (&) condition
   // to select multiple personality traits; therefore, the first forEach cycle filters for the first element
   // 'trait' in the array, then in the next forEach cycle, 'sub'-filters in the same array for the
   // second element, next 'trait', and so on...
   if (query.personalityTraits) {
      // Save personalityTraits as a dedicated array.
      // If personalityTraits is a string, *converts* it into a new array and save.
      if (typeof query.personalityTraits === 'string') {
         personalityTraitsArray = [query.personalityTraits];
      } else {
         personalityTraitsArray = query.personalityTraits;
      }
      // Loop through each trait in the personalityTraits array:
      personalityTraitsArray.forEach((trait) => {
         // Check the trait against each animal in the filteredResults array.
         // Remember, it is initially a copy of the animalsArray,
         // but here we're updating it for each trait in the .forEach() loop.
         // For each trait being targeted by the filter, the filteredResults
         // array will then contain only the entries that contain the trait,
         // so at the end we'll have an array of animals that have every one
         // of the traits when the .forEach() loop is finished.
         filteredResults = filteredResults.filter((animal) => animal.personalityTraits.indexOf(trait) !== -1);
      });
   }
   if (query.diet) {
      filteredResults = filteredResults.filter((animal) => animal.diet === query.diet);
   }
   if (query.species) {
      filteredResults = filteredResults.filter((animal) => animal.species === query.species);
   }
   if (query.name) {
      filteredResults = filteredResults.filter((animal) => animal.name === query.name);
   }
   // return the filtered results:
   return filteredResults;
}

function findById(id, animalsArray) {
   const result = animalsArray.filter((animal) => animal.id === id)[0];
   return result;
}

function createNewAnimal(body, animalsArray) {
   console.log(body);

   const animal = body;
   animalsArray.push(animal);
   fs.writeFileSync(path.join(__dirname, './data/animals.json'), JSON.stringify({ animals: animalsArray }, null, 2));

   // return finished code to post route for response
   return animal;
}

function validateAnimal(animal) {
   if (!animal.name || typeof animal.name !== 'string') {
      return false;
   }
   if (!animal.species || typeof animal.species !== 'string') {
      return false;
   }
   if (!animal.diet || typeof animal.diet !== 'string') {
      return false;
   }
   if (!animal.personalityTraits || !Array.isArray(animal.personalityTraits)) {
      return false;
   }
   return true;
}

app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, './public/index.html'));
});

app.get('/animals', (req, res) => {
   res.sendFile(path.join(__dirname, './public/animals.html'));
});

app.get('/zookeepers', (req, res) => {
   res.sendFile(path.join(__dirname, './public/zookeepers.html'));
});

app.get('/api/animals', (req, res) => {
   let results = animals;
   if (req.query) {
      results = filterByQuery(req.query, results);
   }
   res.json(results);
});

app.get('/api/animals/:id', (req, res) => {
   const result = findById(req.params.id, animals);
   if (result) {
      res.json(result);
   } else {
      res.send(404);
   }
});

app.post('/api/animals', (req, res) => {
   //req.body is where our incoming content will be
   // set id based on what the next index of the array will be
   req.body.id = animals.length.toString();

   // if any data in req.body is incorrect, send 400 error back
   if (!validateAnimal(req.body)) {
      res.status(400).send('The animal is not properly formatted.');
   } else {
      // add animal to json file and animals array in this function
      const animal = createNewAnimal(req.body, animals);
      res.json(req.body);
   }
});

app.get('*', (req, res) => {
   res.sendFile(path.join(__dirname, './public/index.html'));
});

app.listen(PORT, () => {
   console.log(`API server now on port ${PORT}!`);
});
