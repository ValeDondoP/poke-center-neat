/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import * as functions from "firebase-functions";
import * as express from "express";
import * as exphbs from "express-handlebars";

import PokemonService from './pokemonServices';
import PokemonRepository from './pokemonRepository';
import {AdoptionRequest} from './pokemonRepository';

//const path = require("path");
// Crea una instancia de Express
const app = express();

app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));
// Set handlebars as the view engine
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');

// Crear una instancia del repositorio si es necesario
const repository = new PokemonRepository();

// Crear una instancia del servicio y pasarle el repositorio
const pokemonService = new PokemonService(repository);



app.get("/", async (req, res) => {
    const pokemons = await pokemonService.getAllPokemons();
    console.log(pokemons[1])
    res.render('index', { pokemons })
});

app.get('/adopt-pokemon/:id', (req, res) => {
  const pokemonId = req.params.id;
  res.render('adoption_form', { pokemonId });
});

app.post('/adopt-pokemon', async (req, res) => {
  const {name, lastname, rut, description, pokemonId } = req.body;

  const adoptionRequest: AdoptionRequest = {
    name,
    lastname,
    rut,
    description,
    pokemonId
  };
  const message = await pokemonService.adoptPokemon(adoptionRequest)
  console.log(adoptionRequest)
  res.render('response',{message});
});

app.get('/adoption-status', (req, res) => {
  res.render('adoptionStatus');
});


app.get('/adoption-status/:trackingId', async (req, res) => {
  const { trackingId } = req.params;
  try {
    const status = await pokemonService.getAdoptionStatus(trackingId);
    if (status) {
      res.render('adoptionStatus', { status });
    } else {
      res.render('adoptionStatus', { error: 'Adoption status not found' });
    }
  } catch (error) {
    res.status(500).send('Error obtaining adoption status');
  }
});



export const miFuncion = functions.https.onRequest(app);

