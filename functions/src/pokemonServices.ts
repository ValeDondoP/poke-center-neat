import PokemonRepository, {
  AdoptionRequest,
  Pokemon,
  AdoptionStatus,
  Trainer,
} from "./pokemonRepository";

import {v4 as uuidv4} from "uuid";


/**
 * Servicio que tiene metodos para adopción pokemon
 */
class PokemonService {
  private repository: PokemonRepository;

  /**
 * Crea una nueva instancia del servicio Pokémon.
 * @param {PokemonRepository} repository
 *  - El repositorio de Pokémon utilizado por el servicio.
 */
  constructor(repository: PokemonRepository) {
    this.repository = repository;
  }
  /**
 * Obtiene todos los Pokémons no adoptados.
 * @return {Promise<Pokemon[]>}
 * Una promesa que se resuelve con un array de Pokémon.
 * @throws {Error}
 * Error si ocurre un problema al obtener todos los Pokémon.
 */
  async getAllPokemons(): Promise<Pokemon[]> {
    try {
      const allPokemons = await this.repository.findAllNonAdoptedPokemon();
      return allPokemons;
    } catch (error) {
      console.error("Error:", error);
      throw new Error("Error when getting all pokemon");
    }
  }
  /**
 * Adopta un Pokémon.
 * @param {AdoptionRequest} adoptionRequest
 * - La solicitud de adopción del Pokémon.
 * @return {Promise<{string,string}>}
 * - Una promesa que se resuelve con un mensaje
 * de confirmación o rechazo de la adopción.
 * @throws {Error} - Error si ocurre un problema durante el proceso de adopción.
 */
  async adoptPokemon(
    adoptionRequest: AdoptionRequest
  ): Promise<{ message: string, trackingId?: string }> {
    const pokemon = await this.repository.findPokemonById(
      adoptionRequest.pokemonId
    );

    if (!pokemon) {
      throw new Error("Pokemon not found");
    }
    if (pokemon.adopted == true) {
      throw new Error("Pokemon already adopted");
    }

    const trainer = await this.repository.getTrainerByRut(adoptionRequest.rut);


    let probability = 0.5;

    // Si el rut existe en la tabla Trainer,
    // entonces la probabilidad de aceptar es del 95%
    if (trainer) {
      probability = 0.95;
    }

    const number = Math.random();

    if (number < probability) {
      const trackingId = uuidv4();
      await this.repository.updatePokemonAdoptedStatus(
        adoptionRequest.pokemonId
      );
      await this.repository.saveAdoptionRequest(adoptionRequest, trackingId);

      const adoptionStatus: AdoptionStatus = {
        adoptionRequestId: trackingId,
        rut: adoptionRequest.rut,
        status: "preparation",
      };

      const trainer: Trainer = {
        name: adoptionRequest.name,
        lastname: adoptionRequest.lastname,
        rut: adoptionRequest.rut,
        address: adoptionRequest.address,
        pokemon: [adoptionRequest.pokemonId],
      };


      await this.repository.saveAdoptionStatus(adoptionStatus);

      // Simulate preparation delay
      setTimeout(async () => {
        await this.repository.updateAdoptionStatus(trackingId, "success");
      }, 60000);

      await this.repository.saveTrainer(trainer);

      return {
        message: `Adoption application accepted. Tracking ID: ${trackingId}`,
        trackingId: trackingId,
      };
    } else {
      return {message: "Your application has been rejected"};
    }
  }

  /**
 * Obtiene el adoption status
 * @param {string} trackingId -
 * @return {Promise<AdoptionStatus | null>}
 */
  async getAdoptionStatus(
    trackingId: string
  ): Promise<AdoptionStatus | null> {
    return await this.repository.getAdoptionStatusByTrackingId(
      trackingId
    );
  }
}

export default PokemonService;
