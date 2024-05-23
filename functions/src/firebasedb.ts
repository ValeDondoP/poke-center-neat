import * as admin from "firebase-admin";
import * as serviceAccount from "./serviceAccountKey.json";


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL: "https://adoption-crud-api.firebaseio.com",
});

export const db = admin.firestore();
