import {db} from "./firebasedb";

/**
 * Interfaz que representa un Pokémon.
 */
export interface Pokemon {
    id: string;
    name: string;
    type: string[];
    abilities: string[];
    adopted: boolean;
    photo: string;
  }
/**
 *  Interfaz para hacer una request
 */
export interface AdoptionRequest {
    name: string;
    lastname: string;
    rut: string;
    address: string;
    description: string;
    pokemonId: string;
}
/**
 * Interfaz para guardar el estado de una adopcion
 */
export interface AdoptionStatus {
    adoptionRequestId: string;
    rut: string;
    status: "preparation" | "success";
}

/**
 * Interfaz para guardar información del entrenador
 */
export interface Trainer {
  name: string;
  lastname: string;
  rut: string;
  address: string;
  pokemon: string[]; // list of pokemon IDs
}

/**
 * Clase que representa el repositorio de Pokémon.
 */
class PokemonRepository {
  private collectionRef = db.collection("pokemon");
  private adoptionRequestRef = db.collection("adoptionRequest");
  private adoptionStatusRef = db.collection("adoptionStatus");
  private trainerRef = db.collection("trainer");

  /**
   * Busca todos los Pokémon que no han sido adoptados.
   * @return {Promise<Pokemon[]>}
   * Una promesa que se resuelve con un array de Pokémon no adoptados.
   */
  async findAllNonAdoptedPokemon(): Promise<Pokemon[]> {
    const query = await this.collectionRef
      .where("adopted", "==", false)
      .get();

    const nonAdoptedPokemon: Pokemon[] = [];

    query.forEach((doc) => {
      const data = doc.data();
      const pokemon: Pokemon = {
        id: data.id,
        name: data.name,
        type: data.type,
        abilities: data.abilities,
        adopted: data.adopted,
        photo: data.photo,
      };
      nonAdoptedPokemon.push(pokemon);
    });

    return nonAdoptedPokemon;
  }

  /**
 * Busca un Pokémon por su ID.
 * @param {string} pokemonId - El ID del Pokémon a buscar.
 * @return {Promise<Pokemon | null>}
 * Una promesa que se resuelve con el Pokémon encontrado o
 * `null` si no se encuentra.
 */
  async findPokemonById(pokemonId: string): Promise<Pokemon | null> {
    const results = await this.collectionRef.where("id", "==", pokemonId).get();

    if (results.empty) {
      return null;
    }

    const doc = results.docs[0];
    return {id: doc.id, ...doc.data()} as Pokemon;
  }

  /**
   * Busca un Pokémon por su ID y actualiza su estado a adoptado.
   * @param {string} pokemonId - El ID del Pokémon a actualizar.
   * @return {Promise<void>} - Una promesa que se resuelve
   * cuando la actualizacion se ha completado.
   */
  async updatePokemonAdoptedStatus(pokemonId: string): Promise<void> {
    const results = await this.collectionRef.where("id", "==", pokemonId).get();

    if (!results.empty) {
      const document = results.docs[0].ref;
      await document.update({adopted: true});
    }
  }

  /**
 * Guarda una solicitud de adopcion.
  *
  * @param {AdoptionRequest} adoptionRequest -
  * La solicitud de adopcion a guardar.
  * @param {string} trackingId
  * para setear ese id al objeto
  * @return {Promise<void>}
  * Una promesa que se resuelve cuando la operacion se ha completado.
 */
  async saveAdoptionRequest(
    adoptionRequest: AdoptionRequest, trackingId: string
  ): Promise<void> {
    const adoptionDoc = this.adoptionRequestRef.doc(trackingId);
    await adoptionDoc.set(adoptionRequest);
  }

  /**
   * Guarda el estado de una solicitud de adopcion.
   * @param {AdoptionStatus} adoptionStatus -
   * El estado de la solicitud de adopcion a guardar.
   * @return {Promise<void>} -
   * Una promesa que se resuelve cuando la operacion se ha completado.
 */
  async saveAdoptionStatus(adoptionStatus: AdoptionStatus): Promise<void> {
    const doc= this.adoptionStatusRef.doc(adoptionStatus.adoptionRequestId);
    await doc.set(adoptionStatus);
  }

  /**
   * Guarda la información de un entrenador.
   * @param {Trainer} trainer - El entrenador a guardar.
   * @return {Promise<void>} -
   * Una promesa que se resuelve cuando la operación se ha completado.
 */
  async saveTrainer(trainer: Trainer): Promise<void> {
    try {
      const doc = await this.trainerRef.doc(trainer.rut).get();
      if (doc.exists) {
        const existingTrainer = doc.data() as Trainer;

        if (!existingTrainer.pokemon.includes(trainer.pokemon[0])) {
          existingTrainer.pokemon.push(trainer.pokemon[0]);
          // actualizar el documento con el pokemon agregado
          await this.trainerRef.doc(trainer.rut).set(existingTrainer);
        }
      } else {
        // el entrenador no existe, se crea un nuevo documento
        await this.trainerRef.doc(trainer.rut).set(trainer);
      }
    } catch (error) {
      console.error("Error saving trainer:", error);
      throw new Error("Error when saving trainer");
    }
  }
  /**
 * Actualiza el estado de una solicitud de adopcion.
 * @param {string} adoptionRequestId
 * El ID de la solicitud de adopcin a actualizar.
 * @param {"preparation" | "success"} status
 * El nuevo estado de la solicitud de adopcion.
 * @return {Promise<void>}
 * Una promesa que se resuelve cuando la operacion se ha completado.
 */
  async updateAdoptionStatus(
    adoptionRequestId: string,
    status: "preparation" | "success"
  ): Promise<void> {
    const doc = this.adoptionStatusRef.doc(adoptionRequestId);
    await doc.update({status});
  }

  /**
 * Obtiene el estado de adopción mediante el ID de seguimiento.
 * @param {string} trackingId -
 * El ID de seguimiento de la solicitud de adopción.
 * @return {Promise<AdoptionStatus | null>}
 * Una promesa que se resuelve con el estado de la adopción
 * o `null` si no se encuentra.
 */
  async getAdoptionStatusByTrackingId(
    trackingId: string
  ): Promise<AdoptionStatus | null> {
    const document = this.adoptionStatusRef.doc(trackingId);

    const doc = await document.get();

    if (doc.exists) {
      return doc.data() as AdoptionStatus;
    }
    return null;
  }
  /**
 * Obtiene el entrenador por rut
 * @param {string} rut -
 * El rut del entrenador.
 * @return {Promise<Trainer | null>}
 * Una promesa que se resuelve con el objeto trainer
 * o `null` si no se encuentra.
 */
  async getTrainerByRut(rut: string): Promise<Trainer | null> {
    try {
      const document = this.trainerRef.doc(rut);
      const doc = await document.get();

      if (doc.exists) {
        const trainerData = doc.data() as Trainer;
        return trainerData;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting trainer by rut:", error);
      throw new Error("Error getting trainer by rut");
    }
  }
}

export default PokemonRepository;
