import { db } from './firebasedb';

export interface Pokemon {
    id: string;
    name: string;
    type: string[];
    abilities: string[];
    adopted: boolean;
    photo: string;
  }

export interface AdoptionRequest {
    name: string;
    lastname: string;
    rut: string;
    description: string;
    pokemonId: string;
}

export interface AdoptionStatus {
    adoptionRequestId: string;
    rut: string;
    status:  'preparation' | 'success';
}

export interface Trainer {
  name: string;
  lastname: string;
  rut: string;
  pokemon: string[]; // list of pokemon IDs
}

class PokemonRepository {
    private collectionRef = db.collection('pokemon');
    private adoptionRequestRef = db.collection('adoptionRequest');
    private adoptionStatusRef = db.collection('adoptionStatus');
    private trainerRef = db.collection('trainer');

    async findAllNonAdoptedPokemon(): Promise<Pokemon[]>{
      const querySnapshot = await this.collectionRef.where('adopted', '==', false).get();

      const nonAdoptedPokemon: Pokemon[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const pokemon: Pokemon = {
          id: data.id,
          name: data.name,
          type: data.type,
          abilities: data.abilities,
          adopted: data.adopted,
          photo: data.photo
        };
        nonAdoptedPokemon.push(pokemon);
      });

      return nonAdoptedPokemon;
    }

    async findPokemonById(pokemonId: string): Promise<Pokemon | null> {
      const results = await this.collectionRef.where('id', '==', pokemonId).get();

      if (results.empty) {
        return null;
      }

      const doc = results.docs[0];
      return { id: doc.id, ...doc.data() } as Pokemon;
    }

    async updatePokemonAdoptedStatus(pokemonId: string): Promise<void> {
      const results = await this.collectionRef.where('id', '==', pokemonId).get();

      if (!results.empty) {
        const docRef = results.docs[0].ref;
        await docRef.update({ adopted: true });
      }
    }

    async saveAdoptionRequest(adoptionRequest: AdoptionRequest): Promise<void> {
      const adoptionDocRef = this.adoptionRequestRef.doc(adoptionRequest.rut);
      await adoptionDocRef.set(adoptionRequest);
    }

    async saveAdoptionStatus(adoptionStatus: AdoptionStatus): Promise<void> {
      const docRef = this.adoptionStatusRef.doc(adoptionStatus.adoptionRequestId);
      await docRef.set(adoptionStatus);
    }

    async saveTrainer(entrenador: Trainer): Promise<void> {
      const docRef = this.trainerRef.doc(entrenador.rut);
      await docRef.set(entrenador);
    }

    async updateAdoptionStatus(adoptionRequestId: string, status: 'preparation' | 'success'): Promise<void> {
      const docRef = this.adoptionStatusRef.doc(adoptionRequestId);
      await docRef.update({ status });
    }

    async getAdoptionStatusByTrackingId(trackingId: string): Promise<AdoptionStatus | null> {
      const docRef = this.adoptionStatusRef.doc(trackingId);
      console.log(docRef)
      console.log("aaaaaaaa")
      const doc = await docRef.get();

      if (doc.exists) {
        return doc.data() as AdoptionStatus;
      }
      return null;
    }

  }

  export default PokemonRepository;