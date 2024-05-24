import * as functions from "firebase-functions";
import express from "express";
import * as exphbs from "express-handlebars";


import PokemonService from "./pokemonServices";
import PokemonRepository, {AdoptionRequest} from "./pokemonRepository";

import cookieParser from "cookie-parser";
import csurf from "csurf";
import bodyParser from "body-parser";


// const path = require("path");
// Crea una instancia de Express
const app = express();

app.use(express.static("public"));

app.use(express.urlencoded({extended: true}));

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(csurf({cookie: true}));

let globalCsrfToken: string;
// Setear handlebars
app.engine("handlebars", exphbs.engine());
app.set("view engine", "handlebars");


// Crear instancias del provider y service
const repository = new PokemonRepository();
const pokemonService = new PokemonService(repository);


app.get("/", async (req, res) => {
  const pokemons = await pokemonService.getAllPokemons();

  res.render("index", {pokemons});
});

app.get("/adopt-pokemon/:id", (req, res) => {
  const pokemonId = req.params.id;
  globalCsrfToken = req.csrfToken();

  res.render("adoptionForm", {pokemonId, csrfToken: globalCsrfToken});
});

app.post("/adopt-pokemon", async (req, res) => {
  const {name, lastname, rut, address, description, pokemonId,
    _csrf} = req.body;

  if (globalCsrfToken !== _csrf) {
    res.status(403).send("Invalid CSRF token");
    return;
  }
  const adoptionRequest: AdoptionRequest = {
    name,
    lastname,
    rut,
    address,
    description,
    pokemonId,
  };
  const {
    message, trackingId,
  } = await pokemonService.adoptPokemon(adoptionRequest);


  res.render("response", {message, trackingId});
});

app.get("/adoption-status", (req, res) => {
  res.render("adoptionStatus");
});


app.get("/adoption-status/:trackingId", async (req, res) => {
  const {trackingId} = req.params;
  try {
    const status = await pokemonService.getAdoptionStatus(trackingId);
    if (status) {
      res.render("adoptionStatus", {status});
    } else {
      res.render("adoptionStatus", {error: "Adoption status not found"});
    }
  } catch (error) {
    res.status(500).send("Error obtaining adoption status");
  }
});


export const miFuncion = functions.https.onRequest(app);

