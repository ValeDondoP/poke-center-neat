import {AdoptionRequest, Pokemon, AdoptionStatus, Trainer} from './pokemonRepository';
import PokemonRepository  from './pokemonRepository';
import { v4 as uuidv4 } from 'uuid';


class PokemonService {
  private repository: PokemonRepository;

  constructor(repository: PokemonRepository) {
    this.repository = repository;
  }

  async getAllPokemons(): Promise<Pokemon[]> {
    try {
      const allPokemons = await this.repository.findAllNonAdoptedPokemon();
      return allPokemons;
    } catch (error) {
      console.error('Error:', error);
      throw new Error('Error when getting all pokemon');
    }
  }

  async adoptPokemon(adoptionRequest: AdoptionRequest):  Promise<string>  {
    const pokemon = await this.repository.findPokemonById(adoptionRequest.pokemonId);

    if (!pokemon) {
      throw new Error('Pokemon not found');
    }
    if (pokemon.adopted == true) {
      throw new Error('Pokemon already adopted');
    }

    const number = Math.random()

    if(number < 0.5){
        const trackingId = uuidv4();
        await this.repository.updatePokemonAdoptedStatus(adoptionRequest.pokemonId);
        await this.repository.saveAdoptionRequest(adoptionRequest);

        const adoptionStatus: AdoptionStatus = {
            adoptionRequestId: trackingId,
            rut: adoptionRequest.rut,
            status: 'preparation',
          };
        const trainer: Trainer = {
            name: adoptionRequest.name,
            lastname: adoptionRequest.lastname,
            rut: adoptionRequest.rut,
            pokemon: [adoptionRequest.pokemonId],
          };
          await this.repository.saveTrainer(trainer);

        await this.repository.saveAdoptionStatus(adoptionStatus)

        // Simulate preparation delay
        setTimeout(async () => {
          await this.repository.updateAdoptionStatus(trackingId, 'success');
        }, 60000);

        return `Adoption application accepted. Tracking ID: ${trackingId}`;

    }else{
      return 'Your application has been rejected'
    }
  }

async getAdoptionStatus(trackingId: string): Promise<AdoptionStatus | null> {
    return await this.repository.getAdoptionStatusByTrackingId(trackingId);
  }


}

export default PokemonService;
