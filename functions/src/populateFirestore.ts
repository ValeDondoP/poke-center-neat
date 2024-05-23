import axios from 'axios';
import { db } from './firebasedb';


const POKEAPI_URL = 'https://pokeapi.co/api/v2/pokemon';

interface Pokemon {
  id: string;
  name: string;
  type: string[];
  abilities: string[];
  adopted: boolean;
  photo: string;
}

interface PokemonApiResponse {
  name: string
  types: { type: { name: string } }[]
  abilities: { ability: { name: string } }[]
  sprites: { front_default: string }
}


const getPokemonData = async (id: number): Promise<Pokemon> => {
  const response = await axios.get<PokemonApiResponse>(`${POKEAPI_URL}/${id}`);
  const { name, types, abilities, sprites } = response.data;

  return {
    id: id.toString(),
    name,
    type: types.map((t) => t.type.name),
    abilities: abilities.map((a) => a.ability.name),
    adopted: false,
    photo: sprites.front_default
  };
};


const populateFirestore = async () => {
  const batch = db.batch();

  for (let i = 1; i <= 40; i++) {
    const pokemonData = await getPokemonData(i);
    const docRef = db.collection('pokemon').doc(pokemonData.name);
    batch.set(docRef, pokemonData);
  }

  await batch.commit();
  console.log('Firestore has been populated with Pokemon data');
};

// Ejecuta la función populateFirestore
populateFirestore().catch(console.error);
